# 🔄 RESTART DEV SERVER REQUIRED

**Important:** The code changes have been made, but you need to **restart your development server** for them to take effect.

---

## 🚨 Why You Still See the Error

The Next.js dev server is still running the old cached code that queries `user_roles`. The new code that queries `staff_roles` won't be active until you restart.

---

## ✅ How to Fix

### **Step 1: Stop the Dev Server**

In your terminal where the dev server is running, press:
```bash
Ctrl + C
```

### **Step 2: Start the Dev Server Again**

```bash
npm run dev
```

### **Step 3: Hard Refresh Your Browser**

```bash
Ctrl + Shift + R
```
(or Cmd + Shift + R on Mac)

---

## 🔍 Additional Check: Verify Database Table Exists

If the error persists after restarting, check if the `staff_roles` table exists in your Supabase database:

### **Option 1: Via Supabase Dashboard**
1. Go to your Supabase project
2. Click on "Table Editor"
3. Look for `staff_roles` table
4. Verify it has columns: `id`, `staff_id`, `role`, `region`, `created_at`

### **Option 2: Via SQL Editor**
Run this query in Supabase SQL Editor:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'staff_roles';
```

If the table doesn't exist, you need to run the migration:
```sql
-- Run this in Supabase SQL Editor
-- File: supabase/migrations/20240128_rbac_system.sql
```

---

## 🔐 Check RLS Policies

The `staff_roles` table has Row Level Security enabled. Make sure you have a policy that allows users to read their own role:

```sql
-- Check existing policies
SELECT * FROM pg_policies WHERE tablename = 'staff_roles';
```

Expected policy:
```sql
CREATE POLICY "Users can view their own role"
    ON public.staff_roles FOR SELECT
    USING (auth.uid() = staff_id);
```

---

## 🧪 Test the Fix

After restarting:

1. Open browser console (F12)
2. Clear console
3. Refresh the page
4. Check if the error is gone

If you still see the error, check:
- ✅ Dev server was restarted
- ✅ Browser was hard refreshed
- ✅ `staff_roles` table exists in database
- ✅ You have a user account signed up
- ✅ RLS policies are correct

---

## 📝 Quick Checklist

- [ ] Stop dev server (Ctrl+C)
- [ ] Start dev server (npm run dev)
- [ ] Hard refresh browser (Ctrl+Shift+R)
- [ ] Check console for errors
- [ ] Verify `staff_roles` table exists
- [ ] Check RLS policies if needed

---

**Most likely, just restarting the dev server will fix the issue!** 🚀
