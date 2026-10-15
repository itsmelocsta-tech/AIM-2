package app.aim.lifeos

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TrustedOriginTest {
    private val origin = "https://aim.example.test"
    @Test fun allowsOnlyTheConfiguredHttpsOrigin() {
        assertTrue(TrustedOrigin.matches("$origin/path?query=1", origin))
        assertTrue(TrustedOrigin.matches("https://aim.example.test:443/", origin))
        for (url in listOf(
            "$origin.evil.test", "https://aim.example.test@evil.test", "http://aim.example.test",
            "https://aim.example.test:444/", "https://accounts.google.com", "file:///local", "not a URL"
        )) assertFalse(url, TrustedOrigin.matches(url, origin))
    }
}
