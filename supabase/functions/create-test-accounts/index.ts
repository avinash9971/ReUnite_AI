import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const testAccounts = [
      {
        email: "citizen@bringhome.ai",
        password: "citizen@bringhome.ai",
        role: "user",
        full_name: "John Citizen",
      },
      {
        email: "admin@bringhome.ai",
        password: "admin@bringhome.ai",
        role: "admin",
        full_name: "Admin Officer",
      },
    ];

    const results = [];

    for (const account of testAccounts) {
      try {
        const signUpRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": supabaseServiceKey,
          },
          body: JSON.stringify({
            email: account.email,
            password: account.password,
            user_metadata: {
              full_name: account.full_name,
            },
          }),
        });

        const signUpData = await signUpRes.json();

        if (signUpRes.ok && signUpData.user) {
          const userId = signUpData.user.id;

          const profileRes = await fetch(
            `${supabaseUrl}/rest/v1/profiles`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": supabaseServiceKey,
                "Authorization": `Bearer ${supabaseServiceKey}`,
              },
              body: JSON.stringify({
                id: userId,
                email: account.email,
                full_name: account.full_name,
                role: account.role,
              }),
            }
          );

          if (profileRes.ok) {
            results.push({
              success: true,
              email: account.email,
              role: account.role,
              message: `Account created successfully. Password: ${account.password}`,
            });
          } else {
            results.push({
              success: false,
              email: account.email,
              error: `Failed to create profile: ${await profileRes.text()}`,
            });
          }
        } else {
          results.push({
            success: false,
            email: account.email,
            error: signUpData.error?.message || "Failed to create auth user",
          });
        }
      } catch (error) {
        results.push({
          success: false,
          email: account.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return new Response(
      JSON.stringify({
        message: "Test account setup completed",
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});