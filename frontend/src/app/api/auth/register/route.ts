import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import z from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[\W_]/, "Password must contain at least one special character"),
  role: z.enum(["PATIENT", "DOCTOR", "ADMIN"]).default("PATIENT"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Strict Input Validation
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.issues[0].message }, 
        { status: 400 }
      );
    }

    const { email, password, role } = parsed.data;
    const lowerEmail = email.toLowerCase();

    // Check conflict
    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } });
    if (existing) {
      // Prevent leaking user identity on un-throttled routes, but for UX return error
      return NextResponse.json(
        { message: "Account with this email already exists." }, 
        { status: 409 }
      );
    }

    // Hashes via high-cost salt rounds (12 is standard for enterprise)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const newUser = await prisma.user.create({
      data: {
        email: lowerEmail,
        passwordHash,
        role, 
        mfaEnabled: role === "ADMIN" ? true : false, // Autotoggle MFA for Admins
      }
    });

    // We do not return the passwordHash
    return NextResponse.json({
      message: "Registration successful. Please log in.",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("[REGISTER_ERROR]", error);
    return NextResponse.json(
      { message: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}
