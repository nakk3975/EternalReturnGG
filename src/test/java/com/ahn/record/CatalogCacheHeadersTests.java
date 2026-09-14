package com.ahn.record;
import com.ahn.record.eternalreturn.CatalogCacheHeaders;
import com.ahn.record.eternalreturn.EternalReturnRestController;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.mock.web.MockHttpServletResponse;
import static org.junit.jupiter.api.Assertions.*;
class CatalogCacheHeadersTests {
    @Test void onlySuccessfulPublicCatalogsAreCacheable() throws Exception {
        var advice=new CatalogCacheHeaders();
        var method=new MethodParameter(EternalReturnRestController.class.getMethod("weaponInfo"),-1);
        assertTrue(advice.supports(method,StringHttpMessageConverter.class));
        assertFalse(advice.supports(new MethodParameter(EternalReturnRestController.class.getMethod("userDetail",String.class,Long.class),-1),StringHttpMessageConverter.class));
        for(String body:new String[]{"{\"code\":200,\"data\":[]}","{\"code\":400,\"data\":[]}","{\"code\":200,\"data\":[],\"_cacheStale\":true}"}) {
            var response=new ServletServerHttpResponse(new MockHttpServletResponse());
            assertSame(body,advice.beforeBodyWrite(body,method,MediaType.APPLICATION_JSON,StringHttpMessageConverter.class,null,response));
            assertEquals(body.contains("400")?null:body.contains("_cacheStale")?"no-cache":"public, max-age=300",response.getHeaders().getCacheControl());
        }
    }
}
