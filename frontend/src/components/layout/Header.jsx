export default function Header({ title }) {
  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center px-6 sticky top-0 z-40">
      <h1 className="text-[#1b1f28] font-semibold text-lg">{title}</h1>
    </header>
  );
}
