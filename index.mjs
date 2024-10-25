import { Client } from "pg";
import {
  sendEmail,
  generateEmailHtml,
  generatePlainText,
} from "./lib/emailUtils.js";
import { getUpcomingTestAssignments } from "./db/queries.js";

export async function handler() {
  const client = new Client({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();

    const upcomingAssignments = await getUpcomingTestAssignments(client);

    for (const assignment of upcomingAssignments) {
      console.log(
        "assignment ########################################",
        assignment
      );
      const assignmentUrl = `${process.env.NEXT_PUBLIC_APP_URL}/tests/assignments/${assignment.assignmentId}`;
      const formattedDueDate = new Date(assignment.dueDate).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
        }
      );

      // Calculate days until due
      const daysUntilDue = Math.ceil(
        (new Date(assignment.dueDate).getTime() - Date.now()) /
          (1000 * 3600 * 24)
      );

      const additionalTextBeforeButton = `
      <p style="font-size: 16px; color: #444;">
        Dear ${assignment.userName || "Team Member"},
      </p>
      <p style="font-size: 16px; color: #444;">
        This is a reminder that you have an upcoming test due on Salesably. Please review the details below carefully.
      </p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; border-radius: 8px; overflow: hidden">
        <tr>
          <td style="background-color: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333; font-size: 18px; font-weight: 600; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Test Details</h3>
            
            <p style="margin: 12px 0; color: #555; font-size: 16px;"><strong>Test Name:</strong> ${
              assignment.testName
            }</p>
            
            ${
              assignment.testDescription
                ? `<p style="margin: 12px 0; color: #555; font-size: 16px;"><strong>Description:</strong> ${assignment.testDescription}</p>`
                : ""
            }
            
            ${
              assignment.passingScore
                ? `<p style="margin: 12px 0; color: #555; font-size: 16px;"><strong>Passing Score Required:</strong> ${
                    assignment.passingScore
                  } correct answer${
                    assignment.passingScore === 1 ? "" : "s"
                  }</p>`
                : ""
            }

            <p style="margin: 12px 0; color: #555; font-size: 16px;"><strong>Due Date:</strong> ${formattedDueDate} (${daysUntilDue} day${
        daysUntilDue === 1 ? "" : "s"
      } remaining)</p>
            
            <p style="margin: 12px 0; color: #555; font-size: 16px;"><strong>Workspace:</strong> ${
              assignment.workspaceName
            }</p>
          </td>
        </tr>
      </table>`;

      const additionalTextAfterButton = `
        <h3 style="color: #333; margin-top: 20px;">Reminder:</h3>
        <ol style="color: #444; padding-left: 20px;">
          <li>Click the "Take Test" button above to access your test</li>
          <li>Review any provided study materials before beginning</li>
          <li>Complete the test before ${formattedDueDate}</li>
        </ol>

        <p style="font-size: 16px; color: #444; margin-top: 20px;">
          You can also access your test by visiting:<br/>
          <a href="${assignmentUrl}" style="color: #1a73e8; text-decoration: none;">${assignmentUrl}</a>
        </p>

        <p style="font-size: 16px; color: #444;">
          If you have any technical issues or questions, please contact our support team at <a href="mailto:support@salesably.ai" style="color: #1a73e8; text-decoration: none;">support@salesably.ai</a>.
        </p>

        <p style="font-size: 16px; color: #444;">
          Best regards,<br/>
          The Salesably Team
        </p>
      `;

      const html = generateEmailHtml(
        "Test Assignment Reminder",
        additionalTextBeforeButton,
        "Take Test",
        assignmentUrl,
        additionalTextAfterButton,
        {
          logoPosition: "bottom",
          logoSize: "small",
          buttonSize: "default",
        }
      );

      const text = generatePlainText(
        "Test Assignment Reminder",
        "Take Test",
        assignmentUrl,
        `Dear ${assignment.userName || "Team Member"},
        
        This is a reminder that you have an upcoming test due on Salesably. Please find the details below:
        
        Test Details:
        - Test Name: ${assignment.testName}
        ${
          assignment.testDescription
            ? `- Description: ${assignment.testDescription}`
            : ""
        }
        ${
          assignment.passingScore
            ? `- Passing Score Required: ${
                assignment.passingScore
              } correct answer${assignment.passingScore === 1 ? "" : "s"}`
            : ""
        }
        - Due Date: ${formattedDueDate} (${daysUntilDue} day${
          daysUntilDue === 1 ? "" : "s"
        } remaining)
        - Workspace: ${assignment.workspaceName}

        Reminder:
        1. Click the link below to access your test
        2. Review any provided study materials before beginning
        3. Complete the test before ${formattedDueDate}

        Test Link: ${assignmentUrl}

        If you have any technical issues or questions, please contact our support team at support@salesably.ai.

        Best regards,
        The Salesably Team`
      );

      await sendEmail({
        to: assignment.userEmail,
        subject: `Reminder: Test Due - ${assignment.testName}`,
        html,
        text,
      });

      console.log(
        `Test reminder email sent successfully to ${assignment.userEmail} for test ${assignment.testName}`
      );
    }
  } catch (error) {
    console.error("Error sending test reminder emails:", error);
    throw new Error("Failed to send test reminder emails");
  } finally {
    await client.end();
  }
}
