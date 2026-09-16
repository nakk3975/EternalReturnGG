import java.net.URI;
import java.net.http.*;
import java.nio.file.*;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;

/** Fetch pinned, checksum-verified assets at build time; never sends game pixels. */
class PrepareOcr {
    static final Path ROOT = Path.of("src/main/resources/static/vendor/tesseract-7");
    static final HttpClient CLIENT = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(20))
            .followRedirects(HttpClient.Redirect.NORMAL).build();
    static String hash(byte[] bytes) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
    }
    static void fetch(String name, String url, String expected) throws Exception {
        Path target = ROOT.resolve(name);
        if (Files.exists(target) && hash(Files.readAllBytes(target)).equals(expected)) {
            System.out.println("Verified OCR asset: " + name); return;
        }
        var response = CLIENT.send(HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(60)).GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200 || !hash(response.body()).equals(expected))
            throw new IllegalStateException("OCR download/checksum failed: " + name + " HTTP " + response.statusCode());
        Files.createDirectories(ROOT);
        Path temp = Files.createTempFile(ROOT, "ocr-", ".tmp");
        try { Files.write(temp, response.body()); Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING); }
        finally { Files.deleteIfExists(temp); }
        System.out.println("Prepared OCR asset: " + name);
    }
    public static void main(String[] args) throws Exception {
        fetch("tesseract-core-lstm.wasm.js", "https://cdn.jsdelivr.net/npm/tesseract.js-core@7.0.0/tesseract-core-lstm.wasm.js",
                "eef5f8b2f8e20e150680b20adaec4a60babafee3adbe8a94583c81fee46e8680");
        fetch("eng.traineddata", "https://raw.githubusercontent.com/tesseract-ocr/tessdata_fast/4.1.0/eng.traineddata",
                "7d4322bd2a7749724879683fc3912cb542f19906c83bcc1a52132556427170b2");
    }
}
