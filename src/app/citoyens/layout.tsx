// Ce layout s'applique UNIQUEMENT aux pages sous /citoyens
// Il n'inclut PAS la Sidebar admin - résout définitivement l'erreur d'hydratation
export default function CitoyensLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
