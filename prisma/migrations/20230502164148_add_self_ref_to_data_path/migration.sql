-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DataPath" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "path" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "table" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dataMapId" INTEGER NOT NULL,
    "dataPathId" INTEGER,
    CONSTRAINT "DataPath_dataMapId_fkey" FOREIGN KEY ("dataMapId") REFERENCES "DataMap" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DataPath_dataPathId_fkey" FOREIGN KEY ("dataPathId") REFERENCES "DataPath" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DataPath" ("column", "createdAt", "dataMapId", "id", "path", "table", "updatedAt") SELECT "column", "createdAt", "dataMapId", "id", "path", "table", "updatedAt" FROM "DataPath";
DROP TABLE "DataPath";
ALTER TABLE "new_DataPath" RENAME TO "DataPath";
CREATE UNIQUE INDEX "DataPath_dataPathId_key" ON "DataPath"("dataPathId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
