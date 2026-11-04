import { queryOptions } from "@tanstack/react-query";
import { getPublicContent } from "@/lib/content.functions";

export const contentQuery = queryOptions({ queryKey: ["public-content"], queryFn: () => getPublicContent() });
