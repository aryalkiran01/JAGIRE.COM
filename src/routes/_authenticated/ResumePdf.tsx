import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
    color: "#000000",
    backgroundColor: "#ffffff",
  },
  // Header section - matches preview
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
    lineHeight: 1,
    fontFamily: "Helvetica-Bold",
  },
  headline: {
    fontSize: 14,
    color: "#333333",
    marginBottom: 6,
    lineHeight: 1.2,
    fontFamily: "Helvetica",
  },
  contact: {
    fontSize: 10,
    color: "#555555",
    fontFamily: "Helvetica",
    margintop: 5,
  },
  // Section styles - matches preview
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    textTransform: "uppercase",
    borderBottom: "1px solid #333333",
    paddingBottom: 3,
    marginBottom: 6,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  // Experience styles - matches preview
  experienceItem: {
    marginBottom: 10,
  },
  experienceTitle: {
    fontWeight: "bold",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  experienceSubtitle: {
    fontStyle: "italic",
    color: "#555555",
    fontSize: 10,
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  bulletList: {
    marginLeft: 12,
    marginTop: 1,
  },
  bullet: {
    fontSize: 10,
    marginBottom: 1,
    fontFamily: "Helvetica",
    flexDirection: "row",
  },
  bulletPoint: {
    width: 10,
    marginRight: 2,
  },
  bulletText: {
    flex: 1,
  },
  // Education styles - matches preview
  educationItem: {
    marginBottom: 8,
  },
  educationTitle: {
    fontWeight: "bold",
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1,
    marginBottom: 2,
  },
  educationSubtitle: {
    color: "#333333",
    fontSize: 10,
    fontFamily: "Helvetica",
    lineHeight: 1,
    marginBottom: 2,
  },
  educationDetails: {
    fontSize: 9,
    color: "#000000",
    fontFamily: "Helvetica",
    lineHeight: 1.15,
  },
  // Skills styles - matches preview
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 2,
  },
  skill: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 2,
    fontSize: 9,
    border: "0.5px solid #cccccc",
    fontFamily: "Helvetica",
    marginRight: 4,
    marginBottom: 4,
  },
});

function truncateWords(text: string, max: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= max) return text;
  return words.slice(0, max).join(" ") + "…";
}

// Simplified parsing that matches the preview exactly
function parseExperienceItem(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  const title = lines[0] || "";
  const subtitle = lines[1] || "";
  let bullets: string[] = [];

  // Extract bullets (lines starting with •, -, or *)
  const bulletStart = subtitle ? 2 : 1;
  bullets = lines
    .slice(bulletStart)
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l)
    .slice(0, 4);

  return { title, subtitle, bullets };
}

function parseProjectItem(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  const title = lines[0] || "";
  const subtitle = lines[1] || "";
  let bullets: string[] = [];

  const bulletStart = subtitle ? 2 : 1;
  bullets = lines
    .slice(bulletStart)
    .map((l) => l.replace(/^[•\-*]\s*/, "").trim())
    .filter((l) => l)
    .slice(0, 3);

  return { title, subtitle, bullets };
}

function parseEducationItem(item: string) {
  const lines = item
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  const title = lines[0] || "";
  const subtitle = lines[1] || "";
  const details = lines.slice(2).join(" ");

  return { title, subtitle, details };
}

interface ResumePDFProps {
  data: any;
  title: string;
  template: string;
}

export const ResumePDF: React.FC<ResumePDFProps> = ({ data, title, template }) => {
  // Use the same parsing functions as the preview
  const parseExperience = parseExperienceItem;
  const parseProject = parseProjectItem;
  const parseEducation = parseEducationItem;

  return (
    <Document title={title}>
      <Page size="A4" style={styles.page}>
        {/* Header - matches preview exactly */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.full_name || "Your Name"}</Text>
          <Text style={styles.headline}>{data.headline}</Text>
          <Text style={styles.contact}>{[data.email, data.phone].filter(Boolean).join(" | ")}</Text>
        </View>

        {/* Summary - matches preview exactly */}
        {data.summary && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Professional Summary</Text>
            <Text style={{ fontSize: 10, fontFamily: "Helvetica" }}>
              {truncateWords(data.summary, 60)}
            </Text>
          </View>
        )}

        {/* Experience - matches preview exactly */}
        {data.experience.items.some((i: string) => i.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Experience</Text>
            {data.experience.items
              .filter((i: string) => i.trim())
              .map((item: string, idx: number) => {
                const { title, subtitle, bullets } = parseExperience(item);
                return (
                  <View key={idx} style={styles.experienceItem}>
                    {title && <Text style={styles.experienceTitle}>{title}</Text>}
                    {subtitle && <Text style={styles.experienceSubtitle}>{subtitle}</Text>}
                    {bullets.length > 0 && (
                      <View style={styles.bulletList}>
                        {bullets.map((b, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}

        {/* Education - matches preview exactly */}
        {data.education.items.some((i: string) => i.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Education</Text>
            {data.education.items
              .filter((i: string) => i.trim())
              .map((item: string, idx: number) => {
                const { title, subtitle, details } = parseEducation(item);
                return (
                  <View key={idx} style={styles.educationItem}>
                    {title && <Text style={styles.educationTitle}>{title}</Text>}
                    {subtitle && <Text style={styles.educationSubtitle}>{subtitle}</Text>}
                    {details.split("\n").map((line, index) => (
                      <Text key={index} style={styles.educationDetails}>
                        {line}
                      </Text>
                    ))}
                  </View>
                );
              })}
          </View>
        )}

        {/* Projects - matches preview exactly */}
        {data.projects.items.some((i: string) => i.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Projects</Text>
            {data.projects.items
              .filter((i: string) => i.trim())
              .map((item: string, idx: number) => {
                const { title, subtitle, bullets } = parseProject(item);
                return (
                  <View key={idx} style={styles.experienceItem}>
                    {title && <Text style={styles.experienceTitle}>{title}</Text>}
                    {subtitle && <Text style={styles.experienceSubtitle}>{subtitle}</Text>}
                    {bullets.length > 0 && (
                      <View style={styles.bulletList}>
                        {bullets.map((b, i) => (
                          <View key={i} style={styles.bullet}>
                            <Text style={styles.bulletPoint}>•</Text>
                            <Text style={styles.bulletText}>{b}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
          </View>
        )}

        {/* Skills - matches preview exactly */}
        {data.skills.items.some((i: string) => i.trim()) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skills</Text>
            <View style={styles.skillsContainer}>
              {data.skills.items
                .flatMap((item: string) => item.split(",").map((s) => s.trim()))
                .filter(Boolean)
                .map((skill: string, i: number) => (
                  <Text key={i} style={styles.skill}>
                    {skill}
                  </Text>
                ))}
            </View>
          </View>
        )}
      </Page>
    </Document>
  );
};
