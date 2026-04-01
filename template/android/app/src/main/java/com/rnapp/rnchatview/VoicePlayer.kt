package com.rnapp.rnchatview

import android.content.Context
import android.media.MediaPlayer
import android.os.Handler
import android.os.Looper
import android.util.Log

private const val TAG = "VoicePlayer"

/**
 * Singleton helper for playing voice messages.
 *
 * Only one voice message can play at a time. Starting a new playback
 * automatically stops the current one. Uses [MediaPlayer.prepareAsync]
 * for remote URLs and progress updates every 100 ms via [Handler].
 */
class VoicePlayer private constructor(private val context: Context) {

    interface Listener {
        fun onPlaybackStarted(messageId: String)
        fun onPlaybackFinished(messageId: String)
        fun onPlaybackProgress(messageId: String, progress: Float)
    }

    companion object {
        @Volatile
        private var instance: VoicePlayer? = null

        fun getInstance(context: Context): VoicePlayer =
            instance ?: synchronized(this) {
                instance ?: VoicePlayer(context.applicationContext).also { instance = it }
            }
    }

    var listener: Listener? = null
    var currentlyPlayingId: String? = null
        private set

    private var mediaPlayer: MediaPlayer? = null
    private val progressHandler = Handler(Looper.getMainLooper())

    private val progressRunnable = object : Runnable {
        override fun run() {
            val player = mediaPlayer ?: return
            val id = currentlyPlayingId ?: return
            try {
                if (player.isPlaying) {
                    val duration = player.duration.takeIf { it > 0 } ?: return
                    val progress = player.currentPosition.toFloat() / duration
                    listener?.onPlaybackProgress(id, progress.coerceIn(0f, 1f))
                    progressHandler.postDelayed(this, 100)
                }
            } catch (e: Exception) {
                Log.w(TAG, "progressRunnable: error", e)
            }
        }
    }

    fun play(url: String, messageId: String) {
        Log.d(TAG, "play: messageId=$messageId url=${url.take(80)}")

        // Stop current playback if any
        if (currentlyPlayingId != null) {
            val prevId = currentlyPlayingId
            stopInternal()
            if (prevId != null) listener?.onPlaybackFinished(prevId)
        }

        currentlyPlayingId = messageId

        try {
            val player = MediaPlayer()
            player.setDataSource(url)

            player.setOnPreparedListener { mp ->
                Log.d(TAG, "play: prepared, starting playback for $messageId")
                mp.start()
                listener?.onPlaybackStarted(messageId)
                progressHandler.post(progressRunnable)
            }

            player.setOnCompletionListener {
                Log.d(TAG, "play: completed $messageId")
                val id = currentlyPlayingId
                stopInternal()
                if (id != null) listener?.onPlaybackFinished(id)
            }

            player.setOnErrorListener { _, what, extra ->
                Log.e(TAG, "play: error what=$what extra=$extra for $messageId")
                val id = currentlyPlayingId
                stopInternal()
                if (id != null) listener?.onPlaybackFinished(id)
                true
            }

            mediaPlayer = player
            player.prepareAsync()
        } catch (e: Exception) {
            Log.e(TAG, "play: failed to create MediaPlayer", e)
            currentlyPlayingId = null
        }
    }

    fun stop() {
        val id = currentlyPlayingId
        stopInternal()
        if (id != null) listener?.onPlaybackFinished(id)
    }

    fun toggle(url: String, messageId: String) {
        if (currentlyPlayingId == messageId) {
            val player = mediaPlayer
            if (player != null) {
                try {
                    if (player.isPlaying) {
                        player.pause()
                        progressHandler.removeCallbacks(progressRunnable)
                        Log.d(TAG, "toggle: paused $messageId")
                    } else {
                        player.start()
                        progressHandler.post(progressRunnable)
                        Log.d(TAG, "toggle: resumed $messageId")
                    }
                } catch (e: Exception) {
                    Log.w(TAG, "toggle: error", e)
                    stop()
                }
            } else {
                play(url, messageId)
            }
        } else {
            play(url, messageId)
        }
    }

    private fun stopInternal() {
        progressHandler.removeCallbacks(progressRunnable)
        try {
            mediaPlayer?.let {
                if (it.isPlaying) it.stop()
                it.release()
            }
        } catch (_: Exception) {}
        mediaPlayer = null
        currentlyPlayingId = null
    }
}
