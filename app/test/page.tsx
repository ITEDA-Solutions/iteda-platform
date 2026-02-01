export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-4xl font-bold text-blue-600">CSS Test Page</h1>
        <p className="text-gray-600 mt-4">If you see colors and styling, CSS is working!</p>
        <button className="mt-4 bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600">
          Test Button
        </button>
      </div>
    </div>
  )
}
