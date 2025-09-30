interface CategoryCardProps {
  category: {
    id: number;
    Name: string;
    slug: string;
    Description: string;
    Image?: {
      url: string;
      alternativeText?: string;
    };
  };
  onViewProducts: () => void;
}

export default function CategoryCard({ category, onViewProducts }: CategoryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {category.Image && (
        <div className="h-48 overflow-hidden">
          <img
            src={`${process.env.NEXT_PUBLIC_STRAPI_API_URL}${category.Image.url}`}
            alt={category.Image.alternativeText || category.Name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{category.Name}</h3>
        <p className="text-gray-600 text-sm mb-4">{category.Description}</p>
        <button
          onClick={() => {
            console.log('Viewing products for category:', category.id);
            onViewProducts();
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          View Products
        </button>
      </div>
    </div>
  );
}