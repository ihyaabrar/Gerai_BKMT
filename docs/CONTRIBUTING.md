# Contributing to Gerai BKMT

Terima kasih atas minat Anda untuk berkontribusi! 🎉

## Cara Berkontribusi

### 1. Fork Repository
```bash
# Fork di GitHub, lalu clone
git clone https://github.com/YOUR_USERNAME/gerai-bkmt.git
cd gerai-bkmt
```

### 2. Setup Development Environment
```bash
# Install dependencies
npm install

# Setup database
npm run db:push

# Seed data (optional)
npm run db:seed

# Run development server
npm run dev
```

### 3. Buat Branch Baru
```bash
git checkout -b feature/nama-fitur
# atau
git checkout -b fix/nama-bug
```

### 4. Coding Standards

#### TypeScript
- Gunakan TypeScript strict mode
- Definisikan types/interfaces yang jelas
- Hindari `any` type

```typescript
// ✅ Good
interface Product {
  id: string;
  name: string;
  price: number;
}

// ❌ Bad
const product: any = { ... };
```

#### React Components
- Gunakan functional components
- Gunakan hooks (useState, useEffect, dll)
- Pisahkan logic dan UI

```typescript
// ✅ Good
export default function ProductCard({ product }: { product: Product }) {
  const [quantity, setQuantity] = useState(1);
  
  return (
    <Card>
      {/* UI */}
    </Card>
  );
}
```

#### Naming Conventions
- Components: PascalCase (`ProductCard.tsx`)
- Functions: camelCase (`calculateTotal()`)
- Constants: UPPER_SNAKE_CASE (`MAX_ITEMS`)
- Files: kebab-case untuk utils (`format-currency.ts`)

#### File Structure
```
src/
├── app/              # Next.js pages
├── components/       # Reusable components
│   ├── ui/          # UI primitives
│   └── layout/      # Layout components
├── lib/             # Utilities
├── store/           # Zustand stores
└── types/           # TypeScript types
```

### 5. Commit Messages

Gunakan conventional commits:

```bash
# Features
git commit -m "feat: add product search functionality"

# Bug fixes
git commit -m "fix: resolve cart calculation error"

# Documentation
git commit -m "docs: update API documentation"

# Styling
git commit -m "style: improve button hover states"

# Refactoring
git commit -m "refactor: simplify cart logic"

# Tests
git commit -m "test: add unit tests for utils"
```

### 6. Testing

```bash
# Run tests (when available)
npm test

# Check types
npx tsc --noEmit

# Lint
npm run lint
```

### 7. Pull Request

1. Push ke branch Anda
```bash
git push origin feature/nama-fitur
```

2. Buat Pull Request di GitHub
3. Isi deskripsi PR dengan:
   - Apa yang diubah
   - Mengapa perubahan diperlukan
   - Screenshot (jika UI changes)
   - Testing yang sudah dilakukan

#### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Tested locally
- [ ] Added tests
- [ ] All tests passing

## Screenshots (if applicable)
[Add screenshots here]

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings
```

---

## Development Guidelines

### Database Changes

Jika mengubah schema:

```bash
# Update schema.prisma
# Then push changes
npm run db:push

# Update seed if needed
npm run db:seed
```

### Adding New Features

1. Diskusikan di Issues terlebih dahulu
2. Buat branch dari `main`
3. Implement feature
4. Add tests
5. Update documentation
6. Submit PR

### UI Components

Gunakan shadcn/ui patterns:

```typescript
// Use existing components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Follow Tailwind conventions
<Button className="bg-emerald-600 hover:bg-emerald-700">
  Click Me
</Button>
```

### State Management

Gunakan Zustand untuk global state:

```typescript
// Create store
import { create } from 'zustand';

interface StoreState {
  count: number;
  increment: () => void;
}

export const useStore = create<StoreState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));

// Use in component
const { count, increment } = useStore();
```

### API Routes

Follow Next.js App Router conventions:

```typescript
// src/app/api/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const products = await prisma.product.findMany();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const body = await request.json();
  const product = await prisma.product.create({ data: body });
  return NextResponse.json(product);
}
```

---

## Code Review Process

1. Maintainer akan review PR Anda
2. Mungkin ada request changes
3. Lakukan perubahan yang diminta
4. Setelah approved, PR akan di-merge

---

## Bug Reports

Gunakan GitHub Issues dengan template:

```markdown
**Describe the bug**
A clear description of the bug

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What should happen

**Screenshots**
If applicable

**Environment**
- OS: [e.g. Windows 11]
- Browser: [e.g. Chrome 120]
- Version: [e.g. 1.0.0]
```

---

## Feature Requests

```markdown
**Is your feature request related to a problem?**
Description of the problem

**Describe the solution you'd like**
Clear description of what you want

**Describe alternatives you've considered**
Other solutions you've thought about

**Additional context**
Any other context or screenshots
```

---

## Questions?

- Open an issue
- Email: [your-email]
- Discord: [your-discord] (if available)

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## Thank You! 🙏

Every contribution helps make Gerai BKMT better!
