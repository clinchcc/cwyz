import Dropdown from "@/components/blocks/table/dropdown";
import type { NavItem } from "@/types/blocks/base";
import type { Apps } from "@/types/apps";
import TableSlot from "@/components/dashboard/slots/table";
import type { Table as TableSlotType } from "@/types/slots/table";
import { getApps } from "@/models/apps";
import moment from "moment";  

export default async function () {
  const apps = await getApps();

  const table: TableSlotType = {
    title: "Apps",
    toolbar: {
      items: [
        {
          title: "Add App",
          icon: "RiAddLine",
          url: "/admin/apps/add",
        },
      ],
    },
    columns: [
      {
        name: "title",
        title: "Title",
      },
      {
        name: "description",
        title: "Description",
      },
      {
        name: "slug",
        title: "Slug",
      },
      {
        name: "locale",
        title: "Locale",
      },
      {
        name: "status",
        title: "Status",
      },
      {
        name: "created_at",
        title: "Created At",
        callback: (item: Apps) => {
          return moment(item.date).format("YYYY-MM-DD HH:mm:ss");
        },
      },
      {
        callback: (item: Apps) => {
          const items: NavItem[] = [
            {
              title: "Edit",
              icon: "RiEditLine",
              url: `/admin/apps/${item.appid}/edit`,
            },
            {
              title: "View",
              icon: "RiEyeLine",
              url: `/app/${item.appid}`,
              target: "_blank",
            },
          ];

          return <Dropdown items={items} />;
        },
      },
    ],
    data: apps,
    empty_message: "No apps found",
  };

  return <TableSlot {...table} />;
}
