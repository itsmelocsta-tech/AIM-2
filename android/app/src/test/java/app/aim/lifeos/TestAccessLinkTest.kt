package app.aim.lifeos

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class TestAccessLinkTest {
    private val origin = "https://aim.example.test"
    @Test fun acceptsOnlyTheConfiguredRootAndOptionalShareCode() {
        assertTrue(TestAccessLink.matches(origin, origin))
        assertTrue(TestAccessLink.matches("  $origin/?_vercel_share=example_123-ABC  ", origin))
        for (url in listOf(
            "http://aim.example.test/?_vercel_share=test",
            "https://aim.example.test.evil.test/?_vercel_share=test",
            "https://attacker@aim.example.test/?_vercel_share=test",
            "$origin:444/?_vercel_share=test",
            "$origin/path?_vercel_share=test",
            "$origin/?_vercel_share=test&redirect=https://evil.test",
            "$origin/?other=secret",
            "$origin/#fragment",
            "$origin/?_vercel_share=bad code",
            "javascript:alert(1)"
        )) assertFalse(url, TestAccessLink.matches(url, origin))
    }
}
