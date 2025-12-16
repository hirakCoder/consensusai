// PDF Generator for Debate Reports
const PDFDocument = require('pdfkit');

// Colors
const COLORS = {
    primary: '#6366f1',
    secondary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    text: '#1f2937',
    textLight: '#6b7280',
    border: '#e5e7eb',
    background: '#f9fafb'
};

// Decision colors
const DECISION_COLORS = {
    YES: '#10b981',
    NO: '#ef4444',
    CONDITIONAL: '#f59e0b',
    UNKNOWN: '#6b7280'
};

/**
 * Generate a PDF report for a debate
 * @param {Object} debate - The debate data
 * @param {boolean} isPro - Whether user has Pro subscription
 * @returns {Promise<Buffer>} PDF buffer
 */
function generateDebatePDF(debate, isPro = false) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50,
                info: {
                    Title: `ConsensusAI Report: ${debate.question || 'Debate'}`,
                    Author: 'ConsensusAI',
                    Subject: 'AI Debate Analysis Report',
                    Creator: 'ConsensusAI Platform'
                }
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => resolve(Buffer.concat(buffers)));
            doc.on('error', reject);

            // Generate content based on tier
            if (isPro) {
                generateProReport(doc, debate);
            } else {
                generateFreeReport(doc, debate);
            }

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Generate FREE tier report (summary only)
 */
function generateFreeReport(doc, debate) {
    const consensus = extractConsensus(debate);

    // Header
    addHeader(doc);

    // Title
    doc.moveDown(1);
    doc.fontSize(20)
        .fillColor(COLORS.text)
        .text('Debate Summary Report', { align: 'center' });

    doc.moveDown(0.5);
    doc.fontSize(10)
        .fillColor(COLORS.textLight)
        .text(formatDate(debate.timestamp || new Date()), { align: 'center' });

    // Question
    doc.moveDown(1.5);
    doc.fontSize(12)
        .fillColor(COLORS.textLight)
        .text('QUESTION');
    doc.fontSize(14)
        .fillColor(COLORS.text)
        .text(debate.question || 'No question provided');

    // Context (if provided)
    if (debate.context) {
        doc.moveDown(1);
        doc.fontSize(12)
            .fillColor(COLORS.textLight)
            .text('CONTEXT');
        doc.fontSize(11)
            .fillColor(COLORS.text)
            .text(debate.context);
    }

    // Verdict Box
    doc.moveDown(1.5);
    const verdictColor = DECISION_COLORS[consensus.decision] || COLORS.textLight;
    doc.rect(50, doc.y, 495, 80)
        .fillAndStroke(COLORS.background, COLORS.border);

    doc.moveDown(0.5);
    doc.fontSize(12)
        .fillColor(COLORS.textLight)
        .text('VERDICT', 60, doc.y, { align: 'center', width: 475 });

    doc.fontSize(28)
        .fillColor(verdictColor)
        .text(consensus.decision || 'UNKNOWN', { align: 'center', width: 475 });

    doc.moveDown(3);

    // Consensus Type
    if (consensus.type) {
        doc.fontSize(10)
            .fillColor(COLORS.textLight)
            .text(`Consensus Type: ${capitalizeFirst(consensus.type)}`, { align: 'center' });
    }

    // Position Summary
    doc.moveDown(1.5);
    doc.fontSize(12)
        .fillColor(COLORS.textLight)
        .text('EXECUTIVE SUMMARY');
    doc.fontSize(11)
        .fillColor(COLORS.text)
        .text(consensus.position || 'No summary available.');

    // AI Models Used
    doc.moveDown(1.5);
    const llms = debate.llmsUsed || extractLLMs(debate);
    if (llms.length > 0) {
        doc.fontSize(12)
            .fillColor(COLORS.textLight)
            .text('AI MODELS');
        doc.fontSize(10)
            .fillColor(COLORS.text)
            .text(llms.map(l => formatLLMName(l)).join(', '));
    }

    // Upgrade Notice
    doc.moveDown(2);
    doc.rect(50, doc.y, 495, 100)
        .fillAndStroke('#f0f0ff', COLORS.primary);

    const upgradeY = doc.y + 15;
    doc.fontSize(14)
        .fillColor(COLORS.primary)
        .text('Upgrade to Pro for Full Report', 60, upgradeY, { align: 'center', width: 475 });

    doc.moveDown(0.8);
    doc.fontSize(10)
        .fillColor(COLORS.text)
        .text('Get the complete analysis including:', 60, doc.y, { align: 'center', width: 475 });

    doc.fontSize(10)
        .fillColor(COLORS.textLight)
        .text('• Full AI reasoning from each model', { align: 'center' })
        .text('• Complete debate transcript (all rounds)', { align: 'center' })
        .text('• Detailed action plan with timeline', { align: 'center' })
        .text('• Position changes between rounds', { align: 'center' });

    // Footer
    addFooter(doc, false);
}

/**
 * Generate PRO tier report (full details)
 */
function generateProReport(doc, debate) {
    const consensus = extractConsensus(debate);

    // Header
    addHeader(doc, true);

    // Title
    doc.moveDown(1);
    doc.fontSize(22)
        .fillColor(COLORS.text)
        .text('Detailed Debate Analysis Report', { align: 'center' });

    doc.moveDown(0.3);
    doc.fontSize(10)
        .fillColor(COLORS.textLight)
        .text(`Generated: ${formatDate(debate.timestamp || new Date())}`, { align: 'center' });

    // Question Section
    doc.moveDown(1.5);
    addSectionHeader(doc, 'Question');
    doc.fontSize(13)
        .fillColor(COLORS.text)
        .text(debate.question || 'No question provided');

    if (debate.context) {
        doc.moveDown(0.8);
        doc.fontSize(10)
            .fillColor(COLORS.textLight)
            .text('Context: ')
            .fillColor(COLORS.text)
            .text(debate.context, { continued: false });
    }

    // Verdict Section
    doc.moveDown(1.5);
    addSectionHeader(doc, 'Final Verdict');

    const verdictColor = DECISION_COLORS[consensus.decision] || COLORS.textLight;
    doc.rect(50, doc.y + 5, 495, 70)
        .fillAndStroke(COLORS.background, verdictColor);

    doc.moveDown(0.8);
    doc.fontSize(24)
        .fillColor(verdictColor)
        .text(consensus.decision || 'UNKNOWN', 60, doc.y, { align: 'center', width: 475 });

    doc.fontSize(11)
        .fillColor(COLORS.textLight)
        .text(consensus.type ? `${capitalizeFirst(consensus.type)} Consensus` : '', { align: 'center', width: 475 });

    doc.moveDown(3);

    // Executive Summary
    doc.moveDown(0.5);
    addSectionHeader(doc, 'Executive Summary');
    doc.fontSize(11)
        .fillColor(COLORS.text)
        .text(consensus.position || 'No summary available.');

    // AI Reasoning Section
    doc.moveDown(1.5);
    addSectionHeader(doc, 'AI Model Analysis');

    const rounds = debate.rounds || [];
    if (rounds.length > 0) {
        const lastRound = rounds[rounds.length - 1];
        const results = lastRound.results || [];

        results.forEach((result, index) => {
            if (index > 0) doc.moveDown(1);

            // Check if we need a new page
            if (doc.y > 650) {
                doc.addPage();
                addHeader(doc, true);
                doc.moveDown(1);
            }

            // Model name with decision
            const modelColor = DECISION_COLORS[result.decision] || COLORS.textLight;
            doc.fontSize(12)
                .fillColor(COLORS.text)
                .text(formatLLMName(result.llmId || result.llmName), { continued: true })
                .fillColor(modelColor)
                .text(` - ${result.decision || 'UNKNOWN'}`, { continued: true })
                .fillColor(COLORS.textLight)
                .fontSize(10)
                .text(` (Confidence: ${result.confidence || 0}/10)`);

            // Position
            if (result.position) {
                doc.fontSize(10)
                    .fillColor(COLORS.text)
                    .text(result.position, { indent: 10 });
            }

            // Key argument
            if (result.key_argument) {
                doc.moveDown(0.3);
                doc.fontSize(9)
                    .fillColor(COLORS.textLight)
                    .text('Key Argument: ', { continued: true, indent: 10 })
                    .fillColor(COLORS.text)
                    .text(result.key_argument);
            }

            // Risks
            if (result.risks && result.risks.length > 0) {
                doc.moveDown(0.3);
                doc.fontSize(9)
                    .fillColor(COLORS.textLight)
                    .text('Risks: ', { indent: 10 });
                result.risks.slice(0, 3).forEach(risk => {
                    doc.text(`• ${risk}`, { indent: 20 });
                });
            }
        });
    }

    // Action Plan Section
    const actionPlan = debate.actionPlan || debate.finalConsensus?.actionPlan;
    if (actionPlan) {
        doc.addPage();
        addHeader(doc, true);
        doc.moveDown(1);

        addSectionHeader(doc, 'Action Plan');

        // Immediate Actions
        if (actionPlan.immediateActions && actionPlan.immediateActions.length > 0) {
            doc.moveDown(0.5);
            doc.fontSize(11)
                .fillColor(COLORS.text)
                .text('Immediate Actions:');
            actionPlan.immediateActions.forEach((action, i) => {
                doc.fontSize(10)
                    .fillColor(COLORS.text)
                    .text(`${i + 1}. ${action}`, { indent: 15 });
            });
        }

        // Before Proceeding
        if (actionPlan.beforeProceeding && actionPlan.beforeProceeding.length > 0) {
            doc.moveDown(0.8);
            doc.fontSize(11)
                .fillColor(COLORS.text)
                .text('Before Proceeding:');
            actionPlan.beforeProceeding.forEach(item => {
                doc.fontSize(10)
                    .fillColor(COLORS.text)
                    .text(`□ ${item}`, { indent: 15 });
            });
        }

        // Risk Mitigation
        if (actionPlan.riskMitigation && actionPlan.riskMitigation.length > 0) {
            doc.moveDown(0.8);
            doc.fontSize(11)
                .fillColor(COLORS.warning)
                .text('Risk Mitigation:');
            actionPlan.riskMitigation.forEach(item => {
                doc.fontSize(10)
                    .fillColor(COLORS.text)
                    .text(`⚠ ${item}`, { indent: 15 });
            });
        }
    }

    // Debate Rounds Summary
    if (rounds.length > 1) {
        if (doc.y > 500) {
            doc.addPage();
            addHeader(doc, true);
            doc.moveDown(1);
        } else {
            doc.moveDown(1.5);
        }

        addSectionHeader(doc, 'Debate Progression');
        doc.fontSize(10)
            .fillColor(COLORS.textLight)
            .text(`Total rounds: ${rounds.length}`);

        rounds.forEach((round, roundIndex) => {
            if (doc.y > 700) {
                doc.addPage();
                addHeader(doc, true);
                doc.moveDown(1);
            }

            doc.moveDown(0.5);
            doc.fontSize(10)
                .fillColor(COLORS.text)
                .text(`Round ${round.roundNumber || roundIndex + 1}:`);

            const decisions = (round.results || []).map(r =>
                `${formatLLMName(r.llmId)}: ${r.decision}`
            ).join(' | ');
            doc.fontSize(9)
                .fillColor(COLORS.textLight)
                .text(decisions, { indent: 15 });

            if (round.consensus?.reached) {
                doc.fillColor(COLORS.success)
                    .text(`✓ Consensus reached: ${round.consensus.type}`, { indent: 15 });
            }
        });
    }

    // Metadata
    doc.moveDown(1.5);
    doc.fontSize(9)
        .fillColor(COLORS.textLight)
        .text(`Tier: ${capitalizeFirst(debate.tier || 'budget')} | ` +
            `Cost: $${(debate.totalCost || 0).toFixed(4)} | ` +
            `Models: ${(debate.llmsUsed || extractLLMs(debate)).length}`);

    // Footer
    addFooter(doc, true);
}

// Helper functions

function addHeader(doc, isPro = false) {
    // Logo text (since we can't easily embed the image)
    doc.fontSize(16)
        .fillColor(COLORS.primary)
        .text('ConsensusAI', 50, 30, { continued: true })
        .fontSize(10)
        .fillColor(COLORS.textLight)
        .text(isPro ? ' PRO' : '');

    // Line under header
    doc.moveTo(50, 55)
        .lineTo(545, 55)
        .strokeColor(COLORS.border)
        .stroke();

    doc.y = 70;
}

function addFooter(doc, isPro = false) {
    const pageCount = doc.bufferedPageRange().count;

    // Go through each page and add footer
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);

        // Footer line
        doc.moveTo(50, 780)
            .lineTo(545, 780)
            .strokeColor(COLORS.border)
            .stroke();

        doc.fontSize(8)
            .fillColor(COLORS.textLight)
            .text(
                `ConsensusAI${isPro ? ' Pro' : ''} | Page ${i + 1} of ${pageCount}`,
                50,
                790,
                { align: 'center', width: 495 }
            );
    }
}

function addSectionHeader(doc, title) {
    doc.fontSize(14)
        .fillColor(COLORS.primary)
        .text(title);
    doc.moveTo(50, doc.y + 2)
        .lineTo(150, doc.y + 2)
        .strokeColor(COLORS.primary)
        .lineWidth(2)
        .stroke();
    doc.lineWidth(1);
    doc.moveDown(0.5);
}

function extractConsensus(debate) {
    // Try multiple locations for consensus data
    if (debate.finalConsensus) {
        return {
            reached: debate.finalConsensus.reached,
            type: debate.finalConsensus.type,
            decision: debate.finalConsensus.decision || debate.consensusDecision,
            position: debate.finalConsensus.position || debate.consensusPosition
        };
    }

    if (debate.consensusReached !== undefined) {
        return {
            reached: debate.consensusReached,
            type: debate.consensusType,
            decision: debate.consensusDecision,
            position: debate.consensusPosition
        };
    }

    // Check last round
    const rounds = debate.rounds || [];
    if (rounds.length > 0) {
        const lastRound = rounds[rounds.length - 1];
        if (lastRound.consensus) {
            return lastRound.consensus;
        }
    }

    return { reached: false, type: null, decision: null, position: null };
}

function extractLLMs(debate) {
    const llms = new Set();
    const rounds = debate.rounds || [];
    rounds.forEach(round => {
        (round.results || []).forEach(result => {
            if (result.llmId) llms.add(result.llmId);
            else if (result.llmName) llms.add(result.llmName.toLowerCase());
        });
    });
    return Array.from(llms);
}

function formatLLMName(name) {
    const names = {
        openai: 'GPT',
        gemini: 'Gemini',
        claude: 'Claude',
        grok: 'Grok',
        gpt: 'GPT'
    };
    return names[name?.toLowerCase()] || name || 'Unknown';
}

function formatDate(date) {
    try {
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return 'Unknown date';
    }
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

module.exports = {
    generateDebatePDF
};
