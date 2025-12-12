const STATUS_TEXT = {
  200: "OK",
  400: "Bad Request",
  404: "Not Found",
  500: "Internal Server Error"
};

function buildResponse(statusCode, headers, data) {
  // Normalize data
  if (typeof data === "string") {
    data = Buffer.from(data);
  }

  // Default headers
  const finalHeaders = {
    ...headers,
    "Content-Length": String(data.length),
    "Connection": "close"
  };

  // Start building header
  let header = `HTTP/1.1 ${statusCode} ${STATUS_TEXT[statusCode] || "OK"}\r\n`;

  // Add headers
  for (const [k, v] of Object.entries(finalHeaders)) {
    header += `${k}: ${v}\r\n`;
  }

  // End header section
  header += `\r\n`;

  // Return final result (easy to test)
  return { header, body: data };
}

// Example run
console.log(buildResponse(200, {}, "hello world"));


