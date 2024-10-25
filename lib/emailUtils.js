import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const color = {
  background: "#f9f9f9",
  text: "#444",
  mainBackground: "#fff",
  buttonBackground: "#EA580C",
  buttonBorder: "#EA580C",
  buttonText: "#fff",
};

const logoImageUrl =
  "https://res.cloudinary.com/dvxnywonz/image/upload/v1720897910/oecil5pwwkqczdewxlxd.png";

async function sendEmail({ to, subject, cc, html, text }) {
  const message = {
    to,
    from: process.env.SENDGRID_EMAIL_FROM,
    bcc: "vgraupera+salesably@gmail.com",
    cc,
    subject,
    html,
    text,
  };

  try {
    await sgMail.send(message);
  } catch (error) {
    if (error.response) {
      console.error(error.response.body);
    }
    throw new Error(`Failed to send ${subject} email`);
  }
}

function generateEmailHtml(
  email,
  subject,
  bodyContent,
  buttonText,
  linkUrl,
  additionalText,
  options = {}
) {
  const {
    logoPosition = "top", // 'top' or 'bottom'
    logoSize = "default", // 'default', 'small', or custom value like '150px'
    buttonSize = "default", // 'default', 'small', or custom value like '150px'
    buttonPosition = "default", // 'default' or 'belowText'
  } = options;

  // Function to get logo HTML based on size
  function getLogoHtml(logoSize) {
    let width;
    if (logoSize === "small") {
      width = "100px";
    } else if (logoSize === "default") {
      width = "200px";
    } else {
      width = logoSize; // allow custom size, e.g., '150px'
    }

    return `<img src="${logoImageUrl}" alt="Logo" style="width: ${width}; height: auto; display: block; margin: 0 auto;" />`;
  }

  // Function to get button HTML based on size and position
  function getButtonHtml() {
    let padding;
    let fontSize;
    if (buttonSize === "small") {
      padding = "8px 16px";
      fontSize = "16px";
    } else if (buttonSize === "default") {
      padding = "10px 20px";
      fontSize = "18px";
    } else {
      // Custom size not directly supported, default to 'default' sizes
      padding = "10px 20px";
      fontSize = "18px";
    }

    return `
        <tr>
          <td align="center" style="padding: 20px 0;">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td align="center" style="border-radius: 5px;">
                  <a href="${linkUrl}" target="_blank" class="button-link" style="color: #fff; padding: ${padding}; font-size: ${fontSize};">${buttonText}</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
  }

  const logoHtml = getLogoHtml(logoSize);
  const buttonHtml = getButtonHtml();

  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
      body { background: ${color.background}; margin: 0; padding: 0; }
      table { background: ${
        color.mainBackground
      }; max-width: 600px; margin: auto; border-collapse: collapse; border-radius: 10px; }
      img { max-width: 200px; }
      td { font-family: Helvetica, Arial, sans-serif; }
      .button-link {
        display: inline-block;
        background-color: ${color.buttonBackground};
        color: ${color.buttonText};
        padding: 10px 20px;
        border-radius: 5px;
        border: 1px solid ${color.buttonBorder};
        text-decoration: none;
        font-weight: bold;
        font-size: 18px;
        font-family: Helvetica, Arial, sans-serif;
      }
      .button-link:hover, .button-link:active, .button-link:focus {
        background-color: ${color.buttonBackground};
        color: ${color.buttonText};
        text-decoration: none;
      }
      .email-link { color: #666 !important; text-decoration: none; }
    </style>
  </head>
  <body>
    <table width="100%" border="0" cellspacing="20" cellpadding="0">
      ${
        logoPosition === "top"
          ? `
      <tr>
        <td align="center" style="padding: 20px 0px; font-size: 22px; color: ${color.text};">
          ${logoHtml}<br />
          ${bodyContent}
        </td>
      </tr>
      `
          : `
      <tr>
        <td align="center" style="padding: 20px 0px; font-size: 22px; color: ${color.text};">
          ${bodyContent}
        </td>
      </tr>
      `
      }
  
      ${buttonPosition === "belowText" ? "" : buttonHtml}
  
      <tr>
        <td align="left" style="padding: 0px 20px 10px 20px; font-size: 16px; line-height: 22px; color: ${
          color.text
        };">
          ${additionalText}
        </td>
      </tr>
  
      ${buttonPosition === "belowText" ? buttonHtml : ""}
  
      ${
        logoPosition === "bottom"
          ? `
      <tr>
        <td align="center" style="padding: 20px 0px; font-size: 22px; color: ${color.text};">
          ${logoHtml}
        </td>
      </tr>
      `
          : ""
      }
  
      <tr>
        <td align="left" style="padding: 30px 20px 20px 20px; font-size: 14px; color: ${
          color.text
        }; background-color: #f0f0f0; border-radius: 5px;">
          <p>You are receiving this email because you signed up for Salesably. If you wish to unsubscribe, please click <a href="${
            process.env.NEXT_PUBLIC_APP_URL
          }/unsubscribe?email=${encodeURIComponent(
    email
  )}" style="color: #666;">here</a>.</p>
          <p>Our mailing address is: 1268 Balboa Ave, Burlingame CA 94010</p>
        </td>
      </tr>
  
    </table>
  </body>
  </html>
    `;
}

function generatePlainText(
  email,
  subject,
  buttonText,
  linkUrl,
  additionalText = ""
) {
  return `${subject}\n\n${buttonText}: ${linkUrl}\n\n${additionalText.replace(
    /<br>/g,
    "\n"
  )}\n\nYou are receiving this email because you signed up for Salesably. Our mailing address is: 1268 Balboa Ave, Burlingame CA 94010. If you wish to unsubscribe, please visit: ${
    process.env.NEXT_PUBLIC_APP_URL
  }/unsubscribe?email=${encodeURIComponent(email)}`;
}

export { sendEmail, generateEmailHtml, generatePlainText };
