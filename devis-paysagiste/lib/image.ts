// Compression d'image côté navigateur : redimensionne et convertit en
// JPEG data-URL. Utilisé pour le logo et les photos de projet, afin de
// stocker de petites images en base sans service de fichiers externe.
export function compresserImage(fichier: File, maxCote: number): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxCote / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resoudre(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      rejeter(new Error("Image illisible"));
    };
    img.src = url;
  });
}
