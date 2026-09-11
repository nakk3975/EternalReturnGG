# Render deployment

This Spring Boot/JSP app needs a Java server; GitHub Pages cannot execute it.

In Render, create a Blueprint from `nakk3975/EternalReturnGG`, branch `main`.
The root `render.yaml` selects Docker, Singapore, and the free compute plan.
Enter `ETERNAL_RETURN_API_KEY` as a secret environment variable in Render.
Never commit the key. Review the plan before creating the service.

The Docker build runs tests and builds an executable WAR that includes JSPs.
Open `/er/search/view` on the resulting service URL. This is also the HTTP
health check path. It checks page rendering, not external API validity.

The `render` profile disables unused MySQL/MyBatis initialization. Existing
search features call the Eternal Return API and do not need a database.
Supabase PostgreSQL can be added when persistent application data is needed;
it does not replace the Java server.

## Validation status

Local Gradle execution was blocked by network access to the Gradle distribution.
The Docker build and live nickname-to-game flow still need verification on Render.
The free service can sleep when inactive; consult Render's current free plan limits.
