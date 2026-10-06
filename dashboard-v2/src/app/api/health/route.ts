export async function GET() {
  return Response.json({
    healthy: true,
    timestamp: new Date().toISOString(),
  });
}
