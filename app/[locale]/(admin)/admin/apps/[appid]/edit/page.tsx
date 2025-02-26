import {
  getApp,
  updateApp,
  categoryMap,
} from "@/models/apps";
import { localeNames, locales } from "@/i18n/locale";


import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import type { Form as FormSlotType } from "@/types/slots/form";
import type { Apps } from "@/types/apps";
import { getIsoTimestr } from "@/lib/time";
import { getUserInfo } from "@/services/user";

// const CATEGORY_MAP = {
//   1: { name: "默认", slug: "uncategorized" },
//   2: { name: "装机", slug: "software" },
//   3: { name: "网络软件", slug: "net" },
//   4: { name: "媒体", slug: "video" },
//   5: { name: "编程软件", slug: "code" },
//   6: { name: "图像", slug: "pic" },
//   7: { name: "系统软件", slug: "sys" },
//   8: { name: "应用软件", slug: "tools" },
//   9: { name: "手机软件", slug: "mobile" },
//   13: { name: "资讯", slug: "info" },
//   31: { name: "游戏", slug: "game" },
//   52: { name: "AI", slug: "ai" }
// } as const;



export default async function ({ params }: { params: { appid: string } }) {
  const user = await getUserInfo();
  if (!user || !user.uuid) {
    return <Empty message="no auth" />;
  }

  const app = await getApp(Number(params.appid));
  if (!app) {
    return <Empty message="app not found" />;
  }

  const form: FormSlotType = {
    title: "Edit App",
    crumb: {
      items: [
        {
          title: "Apps",
          url: "/admin/apps",
        },
        {
          title: "Edit App",
          is_active: true,
        },
      ],
    },
    fields: [
      {
        name: "title",
        title: "Title",
        type: "text",
        placeholder: "App Title",
        validation: {
          required: true,
        },
      },
      {
        name: "content",
        title: "Content",
        type: "textarea",
        placeholder: "App Description",
        attributes: {
          rows: 8, // Set the number of rows to control the height of the textarea
        },
        validation: {
          required: true,
        },
      },
      {
        name: "category",
        title: "Category",
        type: "select",
        options: Object.entries(categoryMap).map(([id,category]) => ({
          title: `${id} - ${category}`,
          value: id,
        })),
        value: String(app.category || 1),
        validation: { 
          required: true,
        },
      },
      {
        name: "download_url",
        title: "Download URL",
        type: "url",
        placeholder: "App Download URL",
        validation: {
          required: true,
        },
      },
      {
        name: "locale",
        title: "Locale",
        type: "select",
        options: locales.map((locale: string) => ({
          title: localeNames[locale],
          value: locale,
        })),
        value: "zh",
        validation: {
          required: true,
        },
      },
    ],
    data: app,
    passby: {
      user,
      app,
    },
    submit: {
      button: {
        title: "Submit",
      },
      handler: async (data: FormData, passby: any) => {
        "use server";

        const { user, app } = passby;
        if (!user || !app || !app.appid) {
          throw new Error("invalid params");
        }

        const title = data.get("title") as string;
        const content = data.get("content") as string;
        const category = Number.parseInt(data.get("category") as string, 10);
        const download_url = data.get("download_url") as string;
        const locale = data.get("locale") as string;

        if (!title || !content || !download_url || !locale || Number.isNaN(category)) {
          throw new Error("invalid form data");
        }

        const updatedApp: Partial<Apps> = {
          title,
          content,
          category,
          download_url,
          date: new Date(),
        };

        try {
          await updateApp(app.appid, updatedApp, locale);

          return {
            status: "success",
            message: "App updated",
            redirect_url: "/admin/apps",
          };
        } catch (err: any) {
          throw new Error(err.message);
        }
      },
    },
  };

  return <FormSlot {...form} />;
}
