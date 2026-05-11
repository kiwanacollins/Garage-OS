http://localhost:3000/admin

Admin: admin@garageos.local / Admin@1234
Front desk: frontdesk@garageos.local / FrontDesk@1234
Mechanic: mechanic@garageos.local / Mechanic@1234
Customer: customer@example.com / Customer@1234


npm run infra:up       # start Redis + MailHog
# Also ensure Postgres is running with garageos user/db
npm run db:migrate
npm run db:seed
npm run dev