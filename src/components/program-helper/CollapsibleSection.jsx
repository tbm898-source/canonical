import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CollapsibleSection({
  value,
  title,
  description,
  defaultOpen = false,
  children,
  className = "",
}) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultOpen ? value : undefined}
      className={`mb-6 rounded-2xl border border-black/5 bg-white px-4 shadow-sm ${className}`}
    >
      <AccordionItem value={value} className="border-none">
        <AccordionTrigger className="py-4 text-left text-sm font-semibold text-[#0a0a0a] hover:no-underline">
          <span>
            {title}
            {description ? (
              <span className="mt-1 block text-xs font-normal text-[#0a0a0a]/45">{description}</span>
            ) : null}
          </span>
        </AccordionTrigger>
        <AccordionContent className="pb-4 pt-0">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
