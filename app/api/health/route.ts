export async function GET() {
  return Response.json({
    status: "ok",
    service: "royal-vanam",
    timestamp: new Date().toISOString(),
  });
}
