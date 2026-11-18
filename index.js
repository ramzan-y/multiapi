export default {
  async fetch(request) {
    const url = new URL(request.url);
    const workerHost = url.hostname;
    const hfHost = "huiyi67-fixdar.hf.space";

    const targetUrl = new URL(request.url);
    targetUrl.hostname = hfHost;
    targetUrl.protocol = "https:";

    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", hfHost);
    newHeaders.set("X-Forwarded-Host", workerHost);
    newHeaders.set("X-Forwarded-Proto", "https");

    const modifiedRequest = new Request(targetUrl.toString(), {
      method: request.method,
      headers: newHeaders,
      body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
      redirect: "follow"
    });

    try {
      const response = await fetch(modifiedRequest);
      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/json") || contentType.includes("text/")) {
        let bodyText = await response.text();
        const maskedBody = bodyText.replaceAll(hfHost, workerHost);

        const responseHeaders = new Headers(response.headers);
        responseHeaders.delete("content-length");

        return new Response(maskedBody, {
          status: response.status,
          statusText: response.statusText,
          headers: responseHeaders
        });
      }

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });

    } catch (err) {
      return new Response(JSON.stringify({
        status: false,
        message: "Gateway connection error",
        error: err.message
      }), {
        status: 502,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
