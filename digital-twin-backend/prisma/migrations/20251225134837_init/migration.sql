-- CreateTable
CREATE TABLE "TwinSnapshot" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "avgInletTemp" DOUBLE PRECISION NOT NULL,
    "maxInletTemp" DOUBLE PRECISION NOT NULL,
    "totalPowerKW" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "TwinSnapshot_pkey" PRIMARY KEY ("id")
);
