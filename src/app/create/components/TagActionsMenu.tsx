
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit3, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";

const TagActionsMenu = ({ t, openEdit, setOpenDeleteDialog, setDataToDelete }: any) =>{
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 bg-white shadow-2xs border border-primary/20">
        <DropdownMenuItem className="text-primary/90" onClick={() => openEdit("tag", { ...t })}>
          <Edit3 className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-red-600 focus:text-red-600"
          onClick={() => { setOpenDeleteDialog(true); setDataToDelete({ id: t.id, type: "tag" }); }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default TagActionsMenu;