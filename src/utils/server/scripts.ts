import { prisma } from "./prisma";

export async function createLocation() {
  return await prisma.location.create({
    data: {
      name: "Quartetto Plus",
      dataMap: {
        create: {
          dataUrl: "https://www.compass-group.fi/menuapi/feed/json?costNumber=3114&language=fi",
          dataType: "json"
        }
      }
    }
  });
}

export async function createMenuForLocation(locationId: number) {
  const locationDataMap = await prisma.dataMap.findUnique({
    where: {
      locationId
    }
  });
  // return await prisma.menu.create({
  //   data: {
  //     date: new Date(),
  //     location: {
  //       connect: {
  //         id: locationId
  //       }
  //     }
  //   }
  // });
}
