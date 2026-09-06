import { NorthFocus } from "@/components/north/focus";
export default async function Page({params}:{params:Promise<{id:string}>}) {
  const {id}=await params;
  return <NorthFocus id={id}/>;
}
