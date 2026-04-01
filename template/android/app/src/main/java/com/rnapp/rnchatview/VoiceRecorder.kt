package com.rnapp.rnchatview

import android.content.Context
import android.media.MediaRecorder
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.util.Log
import java.io.File

private const val TAG = "VoiceRecorder"

/**
 * Helper for recording voice messages.
 *
 * Records to a temporary .m4a file using AAC codec, 44100 Hz sample rate, mono.
 * Uses a [Handler] for timer updates every 100 ms.
 * The caller is responsible for requesting RECORD_AUDIO permission before calling [startRecording].
 */
class VoiceRecorder(private val context: Context) {

    interface Listener {
        fun onRecordingStarted()
        fun onRecordingStopped(filePath: String, durationMs: Long)
        fun onRecordingCancelled()
        fun onRecordingTimeUpdate(elapsedMs: Long)
    }

    var listener: Listener? = null
    var isRecording: Boolean = false
        private set

    private var mediaRecorder: MediaRecorder? = null
    private var outputFile: File? = null
    private val handler = Handler(Looper.getMainLooper())
    private var startTimeMs: Long = 0

    private val timerRunnable = object : Runnable {
        override fun run() {
            if (!isRecording) return
            val elapsed = System.currentTimeMillis() - startTimeMs
            listener?.onRecordingTimeUpdate(elapsed)
            handler.postDelayed(this, 100)
        }
    }

    fun startRecording() {
        if (isRecording) {
            Log.w(TAG, "startRecording: already recording, ignoring")
            return
        }

        val file = File(context.cacheDir, "voice_${System.currentTimeMillis()}.m4a")
        outputFile = file

        try {
            val recorder = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                MediaRecorder(context)
            } else {
                @Suppress("DEPRECATION")
                MediaRecorder()
            }

            recorder.apply {
                setAudioSource(MediaRecorder.AudioSource.MIC)
                setOutputFormat(MediaRecorder.OutputFormat.MPEG_4)
                setAudioEncoder(MediaRecorder.AudioEncoder.AAC)
                setAudioSamplingRate(44100)
                setAudioChannels(1)
                setAudioEncodingBitRate(128_000)
                setOutputFile(file.absolutePath)
                prepare()
                start()
            }

            mediaRecorder = recorder
            isRecording = true
            startTimeMs = System.currentTimeMillis()

            Log.d(TAG, "startRecording: started → ${file.absolutePath}")
            listener?.onRecordingStarted()

            handler.postDelayed(timerRunnable, 100)
        } catch (e: Exception) {
            Log.e(TAG, "startRecording: failed", e)
            releaseRecorder()
            file.delete()
            outputFile = null
        }
    }

    fun stopRecording() {
        if (!isRecording) {
            Log.w(TAG, "stopRecording: not recording")
            return
        }

        val durationMs = System.currentTimeMillis() - startTimeMs
        val file = outputFile

        handler.removeCallbacks(timerRunnable)
        isRecording = false

        try {
            mediaRecorder?.stop()
        } catch (e: Exception) {
            Log.e(TAG, "stopRecording: stop() failed", e)
        }
        releaseRecorder()

        if (file != null && file.exists() && file.length() > 0) {
            Log.d(TAG, "stopRecording: file=${file.absolutePath} duration=${durationMs}ms")
            listener?.onRecordingStopped(file.absolutePath, durationMs)
        } else {
            Log.w(TAG, "stopRecording: file missing or empty, treating as cancelled")
            listener?.onRecordingCancelled()
        }
    }

    fun cancelRecording() {
        if (!isRecording) return

        handler.removeCallbacks(timerRunnable)
        isRecording = false

        try {
            mediaRecorder?.stop()
        } catch (_: Exception) {}
        releaseRecorder()

        outputFile?.let {
            if (it.exists()) it.delete()
            Log.d(TAG, "cancelRecording: deleted ${it.absolutePath}")
        }
        outputFile = null

        listener?.onRecordingCancelled()
    }

    private fun releaseRecorder() {
        try {
            mediaRecorder?.release()
        } catch (_: Exception) {}
        mediaRecorder = null
    }
}
