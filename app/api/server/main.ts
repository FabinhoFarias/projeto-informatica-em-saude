import "dotenv/config";
import { createApi } from "@/app/api/server/app";

const port = Number(process.env.API_PORT ?? 4000);
createApi().listen(port, () => {
  console.log(`
============================================================
  VIGIA+ API disponível em http://localhost:${port}
============================================================
`);
});
