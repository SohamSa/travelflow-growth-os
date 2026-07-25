import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";

const prismaDir = path.join(process.cwd(), "prisma");
const source = path.join(prismaDir, "dev.db");
const dest = path.join(prismaDir, "demo.db");

if (!existsSync(source)) {
  console.error("Expected prisma/dev.db after seed. Run db:push and db:seed first.");
  process.exit(1);
}

mkdirSync(prismaDir, { recursive: true });
copyFileSync(source, dest);
console.log(`Prepared bundled demo database at ${dest}`);
