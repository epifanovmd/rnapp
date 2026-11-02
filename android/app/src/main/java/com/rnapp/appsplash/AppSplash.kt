package com.rnapp.appsplash

import android.app.Activity
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.TypedValue
import android.view.View
import android.view.ViewTreeObserver.OnPreDrawListener
import androidx.annotation.StyleRes
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.rnapp.R
import java.util.concurrent.ConcurrentLinkedQueue

/**
 * Splash-экран приложения.
 *
 * До Android 12 картинку рисует `windowBackground` темы запуска, с Android 12 —
 * системный SplashScreen API. После старта activity тема меняется на обычную, а
 * поверх окна остаётся [AppSplashView] — он и живёт до вызова `hide()` из JS.
 */
object AppSplash {

    private enum class Status { HIDDEN, HIDING, INITIALIZING, VISIBLE }

    private const val RETRY_DELAY_MS = 100L

    private val promises = ConcurrentLinkedQueue<Promise>()

    @StyleRes
    private var themeResId = -1
    private var status = Status.HIDDEN
    private var view: AppSplashView? = null

    val isVisible: Boolean
        get() = status != Status.HIDDEN

    /** Вызывается из `MainActivity.onCreate` до `super.onCreate`. */
    @JvmStatic
    fun init(activity: Activity, @StyleRes theme: Int) {
        if (themeResId != -1) {
            return
        }

        themeResId = theme
        status = Status.INITIALIZING

        applyPostSplashTheme(activity)
        holdFirstFrame(activity)
        dismissSystemSplash(activity)

        UiThreadUtil.runOnUiThread {
            view = AppSplashView(activity, themeResId)
            status = Status.VISIBLE
        }
    }

    /** Тема запуска нужна только до первого кадра — дальше обычная тема приложения. */
    private fun applyPostSplashTheme(activity: Activity) {
        val value = TypedValue()

        if (activity.theme.resolveAttribute(R.attr.postSplashTheme, value, true)) {
            if (value.resourceId != 0) {
                activity.setTheme(value.resourceId)
            }
        }
    }

    /** Первый кадр придерживается, пока оверлей не добавлен — иначе мигнёт фон. */
    private fun holdFirstFrame(activity: Activity) {
        val content = activity.findViewById<View>(android.R.id.content)

        content.viewTreeObserver.addOnPreDrawListener(object : OnPreDrawListener {
            override fun onPreDraw(): Boolean {
                if (status == Status.INITIALIZING) {
                    return false
                }

                content.viewTreeObserver.removeOnPreDrawListener(this)

                return true
            }
        })
    }

    /** На Android 12+ системный splash убирается сразу: дальше показывает оверлей. */
    private fun dismissSystemSplash(activity: Activity) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
            return
        }

        val splashScreen = activity.splashScreen

        splashScreen.setOnExitAnimationListener { view ->
            view.remove()
            splashScreen.clearOnExitAnimationListener()
        }
    }

    fun hide(context: ReactApplicationContext, fade: Boolean, promise: Promise) {
        promises.add(promise)
        hideAndResolve(context, fade)
    }

    private fun hideAndResolve(context: ReactApplicationContext, fade: Boolean) {
        UiThreadUtil.runOnUiThread {
            val activity = context.currentActivity

            // Оверлей ещё не создан или activity недоступна — пробуем позже.
            if (status == Status.INITIALIZING ||
                activity == null ||
                activity.isFinishing ||
                activity.isDestroyed
            ) {
                Handler(Looper.getMainLooper())
                    .postDelayed({ hideAndResolve(context, fade) }, RETRY_DELAY_MS)

                return@runOnUiThread
            }

            when (status) {
                Status.HIDING -> return@runOnUiThread // ждём конца анимации
                Status.HIDDEN -> {
                    resolveAll()

                    return@runOnUiThread
                }

                else -> status = Status.HIDING
            }

            val onRemoved = {
                view = null
                status = Status.HIDDEN
                resolveAll()
            }

            view?.remove(fade, onRemoved) ?: onRemoved()
        }
    }

    private fun resolveAll() {
        generateSequence { promises.poll() }.forEach { it.resolve(null) }
    }

    /** Сброс при уничтожении хоста: следующий запуск начинается с чистого состояния. */
    fun onHostDestroy() {
        status = Status.HIDDEN
        themeResId = -1
        resolveAll()

        view?.let {
            it.animate().cancel()
            it.remove(fade = false)
            view = null
        }
    }
}
