import Dropdown from "@/components/blocks/table/dropdown";
import type { NavItem } from "@/types/blocks/base";
import type { Apps } from "@/types/apps";
import TableSlot from "@/components/dashboard/slots/table";
import type { Table as TableSlotType } from "@/types/slots/table";
import { getApps } from "@/models/apps";
import moment from "moment";
import Empty from "@/components/blocks/empty";

export default async function () {
  try {
    const { data: apps, total } = await getApps('zh', 1, 20); // 获取第一页，每页20条
    
    if (!apps || !Array.isArray(apps)) {
      return <Empty message="Failed to load apps data" />;
    }

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
          name: "content",
          title: "Content",
        },
        {
          name: "category",
          title: "Category",
          callback: (item: Apps) => {
            return item?.category?.toString() || '-';
          },
        },
        {
          name: "download_url",
          title: "Download URL",
          callback: (item: Apps) => {
            return item?.download_url || '-';
          },
        },
        {
          name: "date",
          title: "Created At",
          callback: (item: Apps) => {
            return item?.date 
              ? moment(item.date).format("YYYY-MM-DD HH:mm:ss")
              : '-';
          },
        },
        {
          callback: (item: Apps) => {
            if (!item?.appid) return null;
            
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
      pagination: {
        total,
        pageSize: 20,
        current: 1
      },
      empty_message: "No apps found",
    };

    return <TableSlot {...table} />;
  } catch (error) {
    console.error('Error in apps page:', error);
    return <Empty message="Error loading apps" />;
  }
}
