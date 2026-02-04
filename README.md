# ONE-DASH

Dashboard analitik untuk affiliate marketing dengan fitur:
- Multi-platform tracking (Shopee, Tokopedia,Tiktokshop (soon) Lazada (soon), Blibli(soon))
- UTM Source tracking
- Smart Insights & Recommendations
- Revenue Estimation

## Tech Stack

**Frontend:** Next.js 14, React, Tailwind CSS, Recharts, Shadcn UI

**Backend:** Go (Fiber), GORM, PostgreSQL (Supabase)

## Setup

### Backend
```bash
cd backend
cp .env.example .env  # Configure your database
go run cmd/main.go
```

### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## License
MIT
