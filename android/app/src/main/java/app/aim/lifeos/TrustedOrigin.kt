package app.aim.lifeos

import java.net.URI

object TrustedOrigin {
    fun matches(url: String, allowedOrigin: String): Boolean = runCatching {
        val candidate = URI(url)
        val allowed = URI(allowedOrigin)
        candidate.scheme.equals("https", ignoreCase = true) &&
            allowed.scheme.equals("https", ignoreCase = true) &&
            candidate.rawUserInfo == null && candidate.host != null &&
            candidate.host.equals(allowed.host, ignoreCase = true) &&
            (if (candidate.port == -1) 443 else candidate.port) ==
            (if (allowed.port == -1) 443 else allowed.port)
    }.getOrDefault(false)
}
