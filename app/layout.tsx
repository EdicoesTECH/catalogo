import "./globals.css";

export const metadata = {
  title: "Carrinho Omie",
  description: "Carrinho Livraria Shalom",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
