export const handleDownload = async (fileUrl, fileName) => {
  try {
    const token = localStorage.getItem("token"); // Ambil token kamu

    const response = await fetch(fileUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`, // Kirim token agar diizinkan backend
      },
    });

    if (!response.ok) throw new Error("Gagal mengunduh berkas");

    const blob = await response.blob();
    const urlBlob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlBlob;
    
    // Tambahkan ekstensi file secara otomatis jika tidak ada
    a.download = fileName; 
    
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    window.URL.revokeObjectURL(urlBlob);
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error download:", error);
    alert("Gagal mengunduh berkas. Pastikan Anda memiliki akses.");
  }
};