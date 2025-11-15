import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import prisma from '../config/prisma';
import { AppError } from '../utils/errors';

/**
 * Get personal information for the authenticated user
 */
export async function getPersonalInfo(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;

    let personalInfo = await prisma.personal_info.findUnique({
      where: { userId },
    });

    // Create personal info if it doesn't exist
    if (!personalInfo) {
      personalInfo = await prisma.personal_info.create({
        data: { userId },
      });
    }

    res.json({
      success: true,
      data: personalInfo,
    });
  } catch (error) {
    console.error('Get personal info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch personal information',
    });
  }
}

/**
 * Update personal information
 */
export async function updatePersonalInfo(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.userId;

    const personalInfo = await prisma.personal_info.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
    });

    res.json({
      success: true,
      message: 'Personal information updated successfully',
      data: personalInfo,
    });
  } catch (error) {
    console.error('Update personal info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update personal information',
    });
  }
}

/**
 * Update emergency contact information
 */
export async function updateEmergencyContact(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { emergencyName, emergencyRelation, emergencyPhone, emergencyEmail } = req.body;

    const personalInfo = await prisma.personal_info.upsert({
      where: { userId },
      update: {
        emergencyName,
        emergencyRelation,
        emergencyPhone,
        emergencyEmail,
      },
      create: {
        userId,
        emergencyName,
        emergencyRelation,
        emergencyPhone,
        emergencyEmail,
      },
    });

    res.json({
      success: true,
      message: 'Emergency contact updated successfully',
      data: {
        emergencyName: personalInfo.emergencyName,
        emergencyRelation: personalInfo.emergencyRelation,
        emergencyPhone: personalInfo.emergencyPhone,
        emergencyEmail: personalInfo.emergencyEmail,
      },
    });
  } catch (error) {
    console.error('Update emergency contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update emergency contact',
    });
  }
}

/**
 * Update address information
 */
export async function updateAddress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user!.id;
    const { permanentAddress, mailingAddress, city, state, postalCode, country } = req.body;

    const personalInfo = await prisma.personal_info.upsert({
      where: { userId },
      update: {
        permanentAddress,
        mailingAddress,
        city,
        state,
        postalCode,
        country,
      },
      create: {
        userId,
        permanentAddress,
        mailingAddress,
        city,
        state,
        postalCode,
        country,
      },
    });

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: {
        permanentAddress: personalInfo.permanentAddress,
        mailingAddress: personalInfo.mailingAddress,
        city: personalInfo.city,
        state: personalInfo.state,
        postalCode: personalInfo.postalCode,
        country: personalInfo.country,
      },
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
    });
  }
}
