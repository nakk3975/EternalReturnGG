package com.ahn.record;
import com.ahn.record.eternalreturn.AssetController;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.MediaType;
import java.util.concurrent.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
class AssetLatencyTests {
    @Test void discoveryCannotBlockConfigResponses() throws Exception {
        var controller=new AssetController();var entered=new CountDownLatch(1);var release=new CountDownLatch(1);
        try {
            var server=MockRestServiceServer.bindTo((RestTemplate)ReflectionTestUtils.getField(controller,"client")).build();
            server.expect(requestTo("https://dak.gg/er/characters/Tazia")).andRespond(request->{entered.countDown();
                try {release.await(3,TimeUnit.SECONDS);}catch(InterruptedException e){Thread.currentThread().interrupt();}
                return withSuccess("game-assets/12.4.0/",MediaType.TEXT_HTML).createResponse(request);
            });
            String before=controller.config().get("baseUrl");
            assertTrue(entered.await(1,TimeUnit.SECONDS));
            assertEquals(before,controller.config().get("baseUrl"));
            assertEquals(1,release.getCount());
        } finally {release.countDown();controller.stop();}
    }
}
