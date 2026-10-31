package app.aim.lifeos

import java.net.URI

/** Only the configured test deployment, never an arbitrary browser or native bridge origin. */
object TestAccessLink {
    fun matches(value: String, allowedOrigin: String): Boolean = runCatching {
        val link = value.trim()
        if (link.any { it.isWhitespace() } || !TrustedOrigin.matches(link, allowedOrigin)) return false
        val parsed = URI(link)
        parsed.rawPath in listOf("", "/") && parsed.rawFragment == null &&
            (parsed.rawQuery == null || Regex("_vercel_share=[A-Za-z0-9_-]+").matches(parsed.rawQuery))
    }.getOrDefault(false)
}
