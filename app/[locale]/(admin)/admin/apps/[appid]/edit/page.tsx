import {
  getApp,
  updateApp,
} from "@/models/apps";
import { localeNames, locales } from "@/i18n/locale";

import Empty from "@/components/blocks/empty";
import FormSlot from "@/components/dashboard/slots/form";
import type { Form as FormSlotType } from "@/types/slots/form";
import type { Apps } from "@/types/apps";
import { getIsoTimestr } from "@/lib/time";
import { getUserInfo } from "@/services/user";

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
        validation: {
          required: true,
        },
      },
      {
        name: "category",
        title: "Category",
        type: "select",
        options: [
          { title: "Uncategorized", value: "1" },
          { title: "Essential Software", value: "2" },
          { title: "Network Tools", value: "3" },
          { title: "Media", value: "4" },
          { title: "Programming", value: "5" },
          { title: "Graphics", value: "6" },
          { title: "System Tools", value: "7" },
          { title: "Applications", value: "8" },
          { title: "Mobile Apps", value: "9" },
          { title: "News", value: "13" },
          { title: "Games", value: "31" },
          { title: "AI", value: "52" },
        ],
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
        const category = Number(data.get("category"));
        const download_url = data.get("download_url") as string;
        const locale = data.get("locale") as string;

        if (!title || !content || !download_url || !locale) {
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
