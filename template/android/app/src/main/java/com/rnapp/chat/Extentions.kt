package com.rnapp.chat.utils

import android.content.Context
import android.util.TypedValue
import android.view.View

fun Float.dpToPx(context: Context): Int =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, this, context.resources.displayMetrics).toInt()

fun Float.dpToPxF(context: Context): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, this, context.resources.displayMetrics)

fun Float.spToPx(context: Context): Float =
    TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_SP, this, context.resources.displayMetrics)

fun Int.dpToPx(context: Context): Int = this.toFloat().dpToPx(context)

fun View.dpToPx(dp: Float): Int = dp.dpToPx(context)
fun View.spToPx(sp: Float): Float = sp.spToPx(context)
