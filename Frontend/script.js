const serverUrl = "http://127.0.0.1:5000";

const startProcessing = async () => {
  const responseDiv = document.getElementById("responseDiv");

  // Send request to server
  const response = await fetch(serverUrl + "/process", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ num: document.getElementById("num").value }),
  });

  const { jobId, message } = await response.json();

  console.log(`Response from server: ${message}`);

  // Open SSE connection
  const eventSrc = new EventSource(serverUrl + "/getUpdate/" + jobId);

  eventSrc.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const newPtag = document.createElement("p");
    newPtag.textContent = `Request ID: ${data.jobId} | Status: ${data.status.toUpperCase()} | Message: ${data.message}`;
    responseDiv.appendChild(newPtag);

    if (data.status === "completed" || data.status === "failed") {
      eventSrc.close(); // Close connection when job is done
    }
  };

  eventSrc.onerror = (event) => {
    console.error("SSE connection error. ERROR_DETAILS: " + event);
    eventSrc.close();
  };
};
