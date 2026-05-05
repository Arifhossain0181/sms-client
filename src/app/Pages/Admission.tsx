/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

const schema = z.object({
	applicantName: z.string().min(1, "Student নাম দাও"),
	dob: z.string().min(1, "জন্ম তারিখ দাও"),
	gender: z.enum(["MALE", "FEMALE", "OTHER"], { message: "Gender select করো" }),
	bloodGroup: z.enum(["A_POS", "A_NEG", "B_POS", "B_NEG", "O_POS", "O_NEG", "AB_POS", "AB_NEG"]).optional(),
	religion: z.string().optional(),
	address: z.string().min(1, "ঠিকানা দাও"),
	guardianName: z.string().min(1, "Guardian নাম দাও"),
	guardianPhone: z.string().min(7, "Guardian phone দাও"),
	guardianEmail: z.string().email("Guardian email ঠিক নয়"),
	targetClassId: z.string().min(1, "Class select করো"),
	payNow: z.boolean().default(false),
	paymentMethod: z.enum(["CASH", "STRIPE"]).optional(),
	paymentAmount: z.coerce.number().optional(),
	transactionId: z.string().optional(),
}).superRefine((data, ctx) => {
	if (data.payNow) {
		if (!data.paymentMethod) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentMethod"], message: "Payment method select করো" });
		}
		if (!data.paymentAmount || data.paymentAmount <= 0) {
			ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["paymentAmount"], message: "Payment amount দাও" });
		}
	}
});

type FormInput = z.input<typeof schema>;
type FormData = z.output<typeof schema>;

type ClassOption = { id: string; name: string; numericLevel: number };

export default function Admission() {
	const [classes, setClasses] = useState<ClassOption[]>([]);
	const [loadingClasses, setLoadingClasses] = useState(false);
	const [classLoadError, setClassLoadError] = useState<string | null>(null);
	const [photoUrl, setPhotoUrl] = useState<string | null>(null);
	const [birthCertUrl, setBirthCertUrl] = useState<string | null>(null);
	const [uploading, setUploading] = useState<{ photo: boolean; birthCert: boolean }>({
		photo: false,
		birthCert: false,
	});
	const [stripeVerifying, setStripeVerifying] = useState(false);
	const [stripePaid, setStripePaid] = useState(false);
	const searchParams = useSearchParams();
	const router = useRouter();
	const autoSubmitRef = useRef(false);

	const {
		register,
		handleSubmit,
		reset,
		setValue,
		watch,
		formState: { errors, isSubmitting },
	} = useForm<FormInput, unknown, FormData>({ resolver: zodResolver(schema) });

	const payNow = watch("payNow");
	const paymentMethod = watch("paymentMethod");
	const paymentAmount = Number(watch("paymentAmount") ?? 0);
	const applicantName = watch("applicantName");
	const targetClassId = watch("targetClassId");

	const saveDraft = () => {
		if (typeof window === "undefined") return;
		const values = {
			applicantName: watch("applicantName"),
			dob: watch("dob"),
			gender: watch("gender"),
			bloodGroup: watch("bloodGroup"),
			religion: watch("religion"),
			address: watch("address"),
			guardianName: watch("guardianName"),
			guardianPhone: watch("guardianPhone"),
			guardianEmail: watch("guardianEmail"),
			targetClassId: watch("targetClassId"),
			payNow: watch("payNow"),
			paymentMethod: watch("paymentMethod"),
			paymentAmount: watch("paymentAmount"),
			transactionId: watch("transactionId"),
			photoUrl,
			birthCertUrl,
		};
		try {
			window.sessionStorage.setItem("admissionDraft", JSON.stringify(values));
		} catch {
			// ignore storage errors
		}
	};

	const restoreDraft = () => {
		if (typeof window === "undefined") return;
		try {
			const raw = window.sessionStorage.getItem("admissionDraft");
			if (!raw) return;
			const draft = JSON.parse(raw) as FormInput & { photoUrl?: string; birthCertUrl?: string };
			reset({
				applicantName: draft.applicantName,
				dob: draft.dob,
				gender: draft.gender,
				bloodGroup: draft.bloodGroup,
				religion: draft.religion,
				address: draft.address,
				guardianName: draft.guardianName,
				guardianPhone: draft.guardianPhone,
				guardianEmail: draft.guardianEmail,
				targetClassId: draft.targetClassId,
				payNow: draft.payNow,
				paymentMethod: draft.paymentMethod,
				paymentAmount: draft.paymentAmount,
				transactionId: draft.transactionId,
			});
			setPhotoUrl(draft.photoUrl ?? null);
			setBirthCertUrl(draft.birthCertUrl ?? null);
		} catch {
			// ignore parse errors
		}
	};

	useEffect(() => {
		const loadClasses = async () => {
			setLoadingClasses(true);
			setClassLoadError(null);
			try {
				const res = await api.get("/admission/classes");
				const data = res.data?.data ?? res.data;
				setClasses(data || []);
			} catch (err: any) {
				const message = err?.response?.data?.message || "Class load failed";
				setClassLoadError(message);
				toast.error(message);
			} finally {
				setLoadingClasses(false);
			}
		};
		loadClasses();
	}, []);

	useEffect(() => {
		restoreDraft();
	}, []);

	useEffect(() => {
		const sessionId = searchParams.get("session_id");
		if (!sessionId || stripePaid || stripeVerifying) return;

		const verify = async () => {
			setStripeVerifying(true);
			try {
				restoreDraft();
				const res = await api.get("/admission/stripe/verify", {
					params: { session_id: sessionId },
				});
				const payload = res.data?.data ?? res.data;
				if (payload?.paid) {
					setStripePaid(true);
					setValue("payNow", true);
					setValue("paymentMethod", "STRIPE");
					if (payload.amountTotal) setValue("paymentAmount", payload.amountTotal);
					setValue("transactionId", sessionId);
					toast.success("Stripe payment verified");

					if (!autoSubmitRef.current) {
						autoSubmitRef.current = true;
						setTimeout(() => {
							handleSubmit(onSubmit)();
						}, 0);
					}
				} else {
					toast.error("Stripe payment not completed");
				}
			} catch (err: any) {
				toast.error(err?.response?.data?.message || "Stripe verification failed");
			} finally {
				setStripeVerifying(false);
			}
		};

		verify();
	}, [searchParams, setValue, stripePaid, stripeVerifying]);

	const handleStripeCheckout = async () => {
		if (!paymentAmount || paymentAmount <= 0) {
			toast.error("Payment amount দিন");
			return;
		}
		try {
			saveDraft();
			const res = await api.post("/admission/stripe/checkout", {
				amount: paymentAmount,
				applicantName,
				targetClassId,
			});
			const payload = res.data?.data ?? res.data;
			if (payload?.url) window.location.href = payload.url;
			else toast.error("Stripe checkout URL পাওয়া যায়নি");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Stripe checkout failed");
		}
	};

	const onSubmit: SubmitHandler<FormData> = async (data) => {
		try {
			if (data.payNow && data.paymentMethod === "STRIPE" && !stripePaid) {
				toast.error("Stripe payment complete করুন");
				return;
			}

			await api.post("/admission/apply", {
				...data,
				paymentMethod: data.payNow ? data.paymentMethod : undefined,
				paymentAmount: data.payNow ? data.paymentAmount : undefined,
				transactionId: data.payNow ? data.transactionId : undefined,
				photoUrl: photoUrl || undefined,
				birthCertUrl: birthCertUrl || undefined,
			});
			toast.success("Admission application submit হয়েছে");
			reset();
			setValue("payNow", false);
			setValue("paymentMethod", undefined);
			setValue("paymentAmount", undefined);
			setValue("transactionId", undefined);
			setPhotoUrl(null);
			setBirthCertUrl(null);
			setStripePaid(false);
			autoSubmitRef.current = false;
			if (typeof window !== "undefined") {
				window.sessionStorage.removeItem("admissionDraft");
			}
			router.replace("/apply-for-admission");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Application failed");
		}
	};

	const uploadDocument = async (file: File, type: "photo" | "birthCert") => {
		setUploading((prev) => ({ ...prev, [type]: true }));
		try {
			const formData = new FormData();
			formData.append("document", file);
			const res = await api.post("/admission/upload-document", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			const url = res.data?.data?.url || res.data?.url;
			if (!url) throw new Error("Upload failed");
			if (type === "photo") setPhotoUrl(url);
			else setBirthCertUrl(url);
			toast.success("Document upload হয়েছে");
		} catch (err: any) {
			toast.error(err?.response?.data?.message || "Upload failed");
		} finally {
			setUploading((prev) => ({ ...prev, [type]: false }));
		}
	};

	return (
		<div className="min-h-screen bg-[#f7f4ee] pt-28 pb-16">
			<div className="mx-auto w-full max-w-4xl px-6">
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-slate-900">Student Admission Form</h1>
					<p className="mt-2 text-sm text-slate-500">
						সব তথ্য ঠিকভাবে দিন। Guardian phone এবং email অবশ্যই সঠিক হতে হবে।
					</p>
				</div>

				<form
					onSubmit={handleSubmit(onSubmit)}
					className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur"
				>
					<div className="grid gap-5 md:grid-cols-2">
						<div>
							<label htmlFor="applicantName" className="block text-sm font-medium">Student Name</label>
							<input
								id="applicantName"
								{...register("applicantName")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
								placeholder="Student নাম"
							/>
							{errors.applicantName && <p className="text-xs text-red-500 mt-1">{errors.applicantName.message}</p>}
						</div>

						<div>
							<label htmlFor="dob" className="block text-sm font-medium">Date of Birth</label>
							<input
								id="dob"
								type="date"
								{...register("dob")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							/>
							{errors.dob && <p className="text-xs text-red-500 mt-1">{errors.dob.message}</p>}
						</div>

						<div>
							<label htmlFor="gender" className="block text-sm font-medium">Gender</label>
							<select
								id="gender"
								{...register("gender")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							>
								<option value="">Select gender</option>
								<option value="MALE">Male</option>
								<option value="FEMALE">Female</option>
								<option value="OTHER">Other</option>
							</select>
							{errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender.message}</p>}
						</div>

						<div>
							<label htmlFor="bloodGroup" className="block text-sm font-medium">Blood Group</label>
							<select
								id="bloodGroup"
								{...register("bloodGroup")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							>
								<option value="">Select blood group</option>
								<option value="A_POS">A+</option>
								<option value="A_NEG">A-</option>
								<option value="B_POS">B+</option>
								<option value="B_NEG">B-</option>
								<option value="O_POS">O+</option>
								<option value="O_NEG">O-</option>
								<option value="AB_POS">AB+</option>
								<option value="AB_NEG">AB-</option>
							</select>
						</div>

						<div>
							<label htmlFor="religion" className="block text-sm font-medium">Religion</label>
							<input
								id="religion"
								{...register("religion")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
								placeholder="Religion"
							/>
						</div>

						<div>
							<label htmlFor="targetClassId" className="block text-sm font-medium">Applying Class</label>
							<select
								id="targetClassId"
								{...register("targetClassId")}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							>
								<option value="">
									{loadingClasses ? "Loading classes..." : "Select class"}
								</option>
								{classes.map((cls) => (
									<option key={cls.id} value={cls.id}>
										{cls.name} (Class {cls.numericLevel})
									</option>
								))}
							</select>
							{loadingClasses && <p className="text-xs text-slate-400 mt-1">Loading classes...</p>}
							{!loadingClasses && classes.length === 0 && !classLoadError && (
								<p className="text-xs text-amber-600 mt-1">
									No classes available. Please add classes from the admin panel.
								</p>
							)}
							{classLoadError && (
								<p className="text-xs text-red-500 mt-1">{classLoadError}</p>
							)}
							{errors.targetClassId && <p className="text-xs text-red-500 mt-1">{errors.targetClassId.message}</p>}
						</div>

						<div className="md:col-span-2">
							<label htmlFor="address" className="block text-sm font-medium">Address</label>
							<textarea
								id="address"
								{...register("address")}
								rows={3}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
								placeholder="Address"
							/>
							{errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
						</div>

						<div className="md:col-span-2">
							<label className="block text-sm font-medium">Student Photo (optional)</label>
							<input
								type="file"
								accept="image/*"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) uploadDocument(file, "photo");
								}}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							/>
							{uploading.photo && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
							{photoUrl && <p className="text-xs text-emerald-600 mt-1">Photo uploaded</p>}
						</div>
						<div className="md:col-span-2">
							<label className="block text-sm font-medium">Birth Certificate (optional)</label>
							<input
								type="file"
								accept="image/*,.pdf"
								onChange={(e) => {
									const file = e.target.files?.[0];
									if (file) uploadDocument(file, "birthCert");
								}}
								className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
							/>
							{uploading.birthCert && <p className="text-xs text-slate-400 mt-1">Uploading...</p>}
							{birthCertUrl && <p className="text-xs text-emerald-600 mt-1">Document uploaded</p>}
						</div>
					</div>

					<div className="mt-8 border-t pt-6">
						<h2 className="text-lg font-semibold text-slate-800">Guardian Info</h2>
						<div className="mt-4 grid gap-5 md:grid-cols-2">
							<div>
								<label htmlFor="guardianName" className="block text-sm font-medium">Guardian Name</label>
								<input
									id="guardianName"
									{...register("guardianName")}
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
									placeholder="Guardian নাম"
								/>
								{errors.guardianName && <p className="text-xs text-red-500 mt-1">{errors.guardianName.message}</p>}
							</div>
							<div>
								<label htmlFor="guardianPhone" className="block text-sm font-medium">Guardian Phone</label>
								<input
									id="guardianPhone"
									{...register("guardianPhone")}
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
									placeholder="01XXXXXXXXX"
								/>
								{errors.guardianPhone && <p className="text-xs text-red-500 mt-1">{errors.guardianPhone.message}</p>}
							</div>
							<div>
								<label htmlFor="guardianEmail" className="block text-sm font-medium">Guardian Email</label>
								<input
									id="guardianEmail"
									{...register("guardianEmail")}
									type="email"
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
									placeholder="guardian@email.com"
								/>
								{errors.guardianEmail && <p className="text-xs text-red-500 mt-1">{errors.guardianEmail.message}</p>}
							</div>
						</div>
					</div>

					<div className="mt-8 border-t pt-6">
						<h2 className="text-lg font-semibold text-slate-800">Payment (Pay Now)</h2>
						<div className="mt-4 grid gap-5 md:grid-cols-2">
							<div className="md:col-span-2 flex items-center gap-2">
								<input
									type="checkbox"
									id="payNow"
									{...register("payNow")}
									className="h-4 w-4"
								/>
								<label htmlFor="payNow" className="text-sm font-medium">
									Pay now
								</label>
							</div>

							<div>
								<label htmlFor="paymentMethod" className="block text-sm font-medium">Payment Method</label>
								<select
									id="paymentMethod"
									{...register("paymentMethod")}
									disabled={stripePaid}
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
								>
									<option value="">Select method</option>
									<option value="CASH">Cash</option>
									<option value="STRIPE">Stripe</option>
								</select>
								{errors.paymentMethod && <p className="text-xs text-red-500 mt-1">{errors.paymentMethod.message}</p>}
							</div>

							<div>
								<label htmlFor="paymentAmount" className="block text-sm font-medium">Amount</label>
								<input
									id="paymentAmount"
									type="number"
									min={1}
									{...register("paymentAmount")}
									disabled={stripePaid}
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
									placeholder="Admission fee"
								/>
								{errors.paymentAmount && <p className="text-xs text-red-500 mt-1">{errors.paymentAmount.message}</p>}
							</div>

							<div className="md:col-span-2">
								<label htmlFor="transactionId" className="block text-sm font-medium">Transaction ID (optional)</label>
								<input
									id="transactionId"
									{...register("transactionId")}
									disabled={stripePaid}
									className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
									placeholder="TXN-123456"
								/>
							</div>

							{payNow && paymentMethod === "STRIPE" && (
								<div className="md:col-span-2">
									<button
										type="button"
										onClick={handleStripeCheckout}
										disabled={stripePaid || stripeVerifying}
										className="mt-2 inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
									>
										{stripePaid ? "Stripe Paid" : stripeVerifying ? "Verifying..." : "Pay with Stripe"}
									</button>
								</div>
							)}
						</div>
					</div>

					<div className="mt-8 flex justify-end gap-3">
						<button
							type="submit"
							disabled={isSubmitting}
							className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 disabled:opacity-50"
						>
							{isSubmitting ? "Submitting..." : "Submit Admission"}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
