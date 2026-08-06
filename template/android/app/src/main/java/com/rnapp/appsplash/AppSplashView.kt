package com.rnapp.appsplash

import android.annotation.SuppressLint
import android.app.Activity
import android.view.View
import android.view.ViewGroup
import android.view.animation.AccelerateInterpolator
import androidx.annotation.StyleRes
import androidx.appcompat.view.ContextThemeWrapper
import com.rnapp.R

/**
 * Оверлей поверх окна, повторяющий системный splash: он держит картинку на
 * экране после старта activity, пока JS не скажет спрятать.
 */
@SuppressLint("ViewConstructor")
class AppSplashView(activity: Activity, @StyleRes themeResId: Int) :
    View(ContextThemeWrapper(activity, themeResId)) {

    companion object {
        private const val FADE_DURATION_MS = 250L
    }

    init {
        setBackgroundResource(R.drawable.splash_compat)
        layoutParams = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.MATCH_PARENT,
        )

        (activity.window.decorView as ViewGroup).addView(this)
    }

    fun remove(fade: Boolean, onRemoved: () -> Unit = {}) {
        val parent = parent as? ViewGroup

        if (parent == null) {
            onRemoved()

            return
        }

        if (!fade) {
            parent.removeView(this)
            onRemoved()

            return
        }

        animate()
            .alpha(0f)
            .setDuration(FADE_DURATION_MS)
            .setInterpolator(AccelerateInterpolator(2f))
            .withEndAction {
                parent.removeView(this)
                onRemoved()
            }
            .start()
    }
}
