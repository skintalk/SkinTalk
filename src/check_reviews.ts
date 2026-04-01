import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hzyveszyugscnwkbpigv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh6eXZlc3p5dWdzY253a2JwaWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1MjAyNDAsImV4cCI6MjA5MDA5NjI0MH0.B7iIxEeCAy7Kg405P_MLzFNlvt3G3UNHc7mSDDvifew';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkReviews() {
  const { data, error } = await supabase
    .from('product_reviews')
    .select('*, user_profiles(name)');

  if (error) {
    console.error('Error fetching reviews:', error);
  } else {
    console.log('Reviews in DB:', JSON.stringify(data, null, 2));
  }
}

checkReviews();
