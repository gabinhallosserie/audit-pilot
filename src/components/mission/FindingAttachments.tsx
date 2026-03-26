import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Trash2, FileText, Image, Music, File } from "lucide-react";
import { toast } from "sonner";
import { fetchAttachments, insertAttachment, deleteAttachment, uploadEvidenceFile } from "@/lib/supabaseService";

interface Attachment {
  id: string;
  finding_id: string;
  mission_id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  file_size: number;
}

interface FindingAttachmentsProps {
  findingId: string;
  missionId: string;
  readOnly?: boolean;
}

const ACCEPT = ".jpg,.jpeg,.png,.pdf,.docx,.mp3,.m4a";

const typeIcon = (type: string) => {
  if (type.startsWith("image/")) return <Image className="w-4 h-4 text-teal" />;
  if (type.startsWith("audio/")) return <Music className="w-4 h-4 text-amber-500" />;
  if (type.includes("pdf") || type.includes("word") || type.includes("document")) return <FileText className="w-4 h-4 text-navy" />;
  return <File className="w-4 h-4 text-muted-foreground" />;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

const FindingAttachments: React.FC<FindingAttachmentsProps> = ({ findingId, missionId, readOnly }) => {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchAttachments(findingId).then((data) => setAttachments(data as Attachment[])).catch(() => {});
  }, [findingId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name} dépasse 10 Mo`);
          continue;
        }
        const id = `ATT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const storagePath = `${missionId}/${findingId}/${id}-${file.name}`;
        await uploadEvidenceFile(storagePath, file);
        const att = { id, finding_id: findingId, mission_id: missionId, file_name: file.name, file_type: file.type, file_path: storagePath, file_size: file.size };
        await insertAttachment(att);
        setAttachments((prev) => [...prev, att]);
      }
      toast.success("Fichier(s) uploadé(s)");
    } catch {
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (att: Attachment) => {
    try {
      await deleteAttachment(att.id, att.file_path);
      setAttachments((prev) => prev.filter((a) => a.id !== att.id));
      toast.info("Pièce jointe supprimée");
    } catch {
      toast.error("Erreur de suppression");
    }
  };

  return (
    <div className="mt-2 space-y-1">
      {attachments.length > 0 && (
        <div className="space-y-1">
          {attachments.map((att) => (
            <div key={att.id} className="flex items-center gap-2 text-xs bg-muted/40 rounded px-2 py-1">
              {typeIcon(att.file_type)}
              <span className="truncate flex-1">{att.file_name}</span>
              <span className="text-muted-foreground">{formatSize(att.file_size)}</span>
              {!readOnly && (
                <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(att)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
      {!readOnly && (
        <label className="inline-flex items-center gap-1 text-xs text-teal hover:underline cursor-pointer">
          <Paperclip className="w-3 h-3" />
          {uploading ? "Upload en cours..." : "Ajouter une preuve"}
          <Input type="file" accept={ACCEPT} multiple className="hidden" onChange={handleUpload} disabled={uploading} />
        </label>
      )}
    </div>
  );
};

export default FindingAttachments;
