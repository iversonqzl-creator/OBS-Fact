import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileSpreadsheet, Shield, ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { useAuth } from "@/context/AuthContext";

const CONTAINER = { animate: { transition: { staggerChildren: 0.08 } } };
const ITEM = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 } };

function ModuleCard({ to, icon: Icon, title, desc, testid }) {
  return (
    <motion.div variants={ITEM}>
      <Link
        to={to}
        data-testid={testid}
        className="group flex h-full flex-col justify-between border border-border bg-surface p-8 transition-transform hover:-translate-y-1"
        style={{ transitionProperty: "transform, border-color" }}
      >
        <div>
          <div className="grid h-14 w-14 place-items-center bg-primary/10 text-primary">
            <Icon className="h-6 w-6" />
          </div>
          <h2 className="mt-6 font-heading text-xl font-semibold tracking-tight text-foreground">{title}</h2>
          {desc && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>}
        </div>
        <span className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-primary">
          Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" style={{ transitionProperty: "transform" }} />
        </span>
      </Link>
    </motion.div>
  );
}

export default function ModuleSelect() {
  const { user } = useAuth();
  return (
    <Layout>
      <div className="mb-12">
        <p className="text-[0.7rem] uppercase tracking-[0.25em] text-muted-foreground">Welcome{user?.name ? `, ${user.name}` : ""}</p>
        <h1 className="mt-2 font-heading text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
          Choose a module
        </h1>
      </div>

      <motion.div
        variants={CONTAINER}
        initial="initial"
        animate="animate"
        className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        data-testid="module-grid"
      >
        <ModuleCard
          to="/word-to-excel"
          icon={FileSpreadsheet}
          title="Word → Excel"
          testid="module-word-to-excel"
        />
        {user?.role === "admin" && (
          <ModuleCard
            to="/admin"
            icon={Shield}
            title="Admin Portal"
            desc="Create and manage user accounts. Assign admin or general-user access."
            testid="module-admin"
          />
        )}
      </motion.div>
    </Layout>
  );
}
