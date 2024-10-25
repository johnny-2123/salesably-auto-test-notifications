export async function getUpcomingTestAssignments(client) {
  const { rows: assignments } = await client.query(`
      SELECT
        ta.id,
        ta."dueDate",
        t.name AS "testName",
        t.description AS "testDescription", 
        t."passingScore",
        u.name AS "userName",
        u.email AS "userEmail",
        w.name AS "workspaceName"
      FROM
        "TestAssignment" ta
        JOIN "Test" t ON ta."testId" = t.id
        JOIN "User" u ON ta."userId" = u.id
        JOIN "Workspace" w ON t."workspaceId" = w.id
      WHERE
        ta."dueDate" > NOW()
        AND ta."completedAt" IS NULL
      ORDER BY
        ta."dueDate" ASC
    `);

  return assignments;
}
